const express = require('express');
const path = require('path');
const { execFile } = require('child_process');

const router = express.Router();

// POST /api/v1/dev/seed -> runs the standalone seed script in a child process
router.post('/seed', async (req, res) => {
  try {
    // Safety guard: allow in any non-production environment (no flag required)
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    if (isProd) return res.status(403).json({ success: false, message: 'Seeding is disabled on this environment' });

    const scriptPath = path.resolve(__dirname, '../scripts/seed.js');
    const child = execFile(process.execPath, [scriptPath], {
      env: { ...process.env },
      cwd: path.resolve(__dirname, '../../'),
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('error', (err) => {
      return res.status(500).json({ success: false, message: 'Seed process failed to start', error: String(err) });
    });

    child.on('close', (code) => {
      if (code === 0) {
        return res.status(200).json({ success: true, message: 'Seed complete', stdout });
      }
      return res.status(500).json({ success: false, message: 'Seed process exited with error', code, stdout, stderr });
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to trigger seed', error: String(e) });
  }
});

module.exports = router;
