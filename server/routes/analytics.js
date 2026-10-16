import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/overview - Real-time workforce metrics directly from SQLite DB
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM employees').get();
    const totalEmployees = totalRow ? totalRow.count : 0;

    const verifiedRow = db.prepare(`
      SELECT COUNT(*) as count FROM employees 
      WHERE status = 'Complete' OR profile_completion >= 80
    `).get();
    const verifiedCount = verifiedRow ? verifiedRow.count : 0;

    const avgRow = db.prepare('SELECT AVG(profile_completion) as avg FROM employees').get();
    const avgCompletion = avgRow && avgRow.avg ? Math.round(avgRow.avg) : 0;

    // Skill coverage snapshot by category directly computed from SQLite tables
    const categories = [
      { label: 'Frontend', category: 'frontend', color: 'bg-[#1265FF]' },
      { label: 'Backend', category: 'backend', color: 'bg-[#00B4D8]' },
      { label: 'Database', category: 'database', color: 'bg-[#6366F1]' },
      { label: 'Cloud', category: 'cloud', color: 'bg-[#10B981]' },
      { label: 'Data', category: 'data', color: 'bg-[#8B5CF6]' },
      { label: 'DevOps & Tools', category: 'devops & tools', color: 'bg-[#EC4899]' },
    ];

    const skillCoverage = categories.map((cat) => {
      const row = db.prepare(`
        SELECT COUNT(DISTINCT employee_id) as count 
        FROM employee_skills 
        WHERE LOWER(category) = ?
      `).get(cat.category);
      const count = row ? row.count : 0;
      const percentage = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
      return {
        label: cat.label,
        count,
        percentage,
        barColor: cat.color,
      };
    });

    // Domain coverage from employee_domain_expertise
    const domainRow = db.prepare(`
      SELECT COUNT(DISTINCT employee_id) as count FROM employee_domain_expertise
    `).get();
    const domainCount = domainRow ? domainRow.count : 0;
    const domainPercentage = totalEmployees > 0 ? Math.round((domainCount / totalEmployees) * 100) : 0;
    skillCoverage.push({
      label: 'Domain',
      count: domainCount,
      percentage: domainPercentage,
      barColor: 'bg-[#F59E0B]',
    });

    // Snapshot today's metrics for trend tracking
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT OR IGNORE INTO daily_snapshots (snapshot_date, total_employees, avg_completion, verified_count)
      VALUES (?, ?, ?, ?)
    `).run(today, totalEmployees, avgCompletion, verifiedCount);

    // Compute trends by comparing with 30-day-ago snapshot
    let trendEmployees = 'N/A';
    let trendCompletion = 'N/A';
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const oldSnapshot = db.prepare('SELECT * FROM daily_snapshots WHERE snapshot_date <= ? ORDER BY snapshot_date DESC LIMIT 1').get(thirtyDaysAgo);
    if (oldSnapshot && oldSnapshot.total_employees > 0) {
      const empChange = Math.round(((totalEmployees - oldSnapshot.total_employees) / oldSnapshot.total_employees) * 100);
      trendEmployees = empChange >= 0 ? `+${empChange}%` : `${empChange}%`;
    }
    if (oldSnapshot && oldSnapshot.avg_completion > 0) {
      const compChange = Math.round(avgCompletion - oldSnapshot.avg_completion);
      trendCompletion = compChange >= 0 ? `+${compChange}%` : `${compChange}%`;
    }

    return res.json({
      totalEmployees,
      verifiedCount,
      completionRate: avgCompletion,
      skillCoverage,
      trend: {
        employees: trendEmployees,
        completion: trendCompletion,
      },
    });
  } catch (err) {
    console.error('Error calculating analytics overview:', err);
    return res.status(500).json({ error: 'Failed to calculate workforce analytics' });
  }
});

export default router;
