import jwt from 'jsonwebtoken';
import db from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Create a .env file with JWT_SECRET=<your-secret>');
  process.exit(1);
}

// Authenticate user via JWT Bearer token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user and permissions from SQLite
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.role_id, u.employee_id, u.status, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User is inactive or not found' });
    }

    // Fetch permissions
    const perms = db.prepare(`
      SELECT p.id
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(user.role_id).map((r) => r.id);

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_id,
      roleName: user.role_name,
      employeeId: user.employee_id,
      permissions: perms,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// RBAC Middleware to require specific permissions
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super Admin has all access
    if (req.user.role === 'SUPER_ADMIN' || req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      error: `Forbidden: Missing required permission '${permission}'` 
    });
  };
}

// RBAC Middleware to require specific role
export function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user || !rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Requires one of [${rolesArray.join(', ')}] role` 
      });
    }
    next();
  };
}
