import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { JWT_SECRET, authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();

function generateId() {
  return 'USR_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function fetchPermissions(roleId) {
  return db.prepare(`
    SELECT p.id FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `).all(roleId).map((r) => r.id);
}

function buildUserResponse(user) {
  const permissions = fetchPermissions(user.role_id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role_id,
    roleName: user.role_name,
    employeeId: user.employee_id || null,
    permissions,
  };
}

function validatePassword(password) {
  if (!password || password.length < 12) return 'Password must be at least 12 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain a special character';
  return null;
}

// GET /api/auth/status - Public. Returns whether first-admin setup is needed.
router.get('/status', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return res.json({ needsSetup: !row || row.count === 0 });
});

// POST /api/auth/setup - Public. Only works when zero users exist.
router.post('/setup', async (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount && userCount.count > 0) {
      return res.status(403).json({ error: 'Setup already completed. Use login instead.' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = generateId();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role_id, status)
      VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 'ACTIVE')
    `).run(id, name.trim(), email.trim().toLowerCase(), passwordHash);

    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.role_id, u.employee_id, u.status, r.name as role_name
      FROM users u JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user: buildUserResponse(user) });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('Setup error:', err);
    return res.status(500).json({ error: 'Failed to complete setup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.employee_id, u.status, r.name as role_name
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = LOWER(?)
  `).get(email.trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Account is locked or inactive' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({ token, user: buildUserResponse(user) });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/auth/roles
router.get('/roles', authenticateToken, (req, res) => {
  const roles = db.prepare('SELECT id, name, description FROM roles').all();
  return res.json({ roles });
});

// GET /api/auth/users - List all users (rbac:manage)
router.get('/users', authenticateToken, requirePermission('rbac:manage'), (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role_id, u.employee_id, u.status, u.last_login_at, u.created_at, r.name as role_name
    FROM users u JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at ASC
  `).all();

  return res.json({
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role_id,
      roleName: u.role_name,
      employeeId: u.employee_id,
      status: u.status,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    }))
  });
});

// POST /api/auth/users - Create a new user (rbac:manage)
router.post('/users', authenticateToken, requirePermission('rbac:manage'), async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ error: 'Name, email, password, and roleId are required' });
    }

    const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(roleId);
    if (!role) {
      return res.status(400).json({ error: `Invalid role: ${roleId}` });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = generateId();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role_id, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(id, name.trim(), email.trim().toLowerCase(), passwordHash, roleId);

    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.role_id, u.employee_id, u.status, r.name as role_name
      FROM users u JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(id);

    return res.status(201).json({ user: buildUserResponse(user) });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/auth/users/:id - Update user role/status (rbac:manage)
router.put('/users/:id', authenticateToken, requirePermission('rbac:manage'), (req, res) => {
  const { id } = req.params;
  const { roleId, status, name } = req.body;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = [];
  const params = [];

  if (roleId) {
    const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(roleId);
    if (!role) return res.status(400).json({ error: `Invalid role: ${roleId}` });
    updates.push('role_id = ?');
    params.push(roleId);
  }
  if (status) {
    if (!['ACTIVE', 'INACTIVE', 'LOCKED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    updates.push('status = ?');
    params.push(status);
  }
  if (name) {
    updates.push('name = ?');
    params.push(name.trim());
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT u.id, u.name, u.email, u.role_id, u.employee_id, u.status, r.name as role_name
    FROM users u JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(id);

  return res.json({ user: buildUserResponse(updated) });
});

// PUT /api/auth/users/:id/password - Change password (rbac:manage or self)
router.put('/users/:id/password', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const isSelf = req.user.id === id;
  const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.permissions.includes('rbac:manage');
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'You can only change your own password' });
  }

  const { password } = req.body;
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(passwordHash, id);

  return res.json({ message: 'Password updated successfully' });
});

export default router;
