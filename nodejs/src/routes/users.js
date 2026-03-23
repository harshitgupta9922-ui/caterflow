const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router  = express.Router();

// GET /api/users — admin only
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, role, client_id FROM users ORDER BY role, name'
    );
    // Rename client_id -> clientId for frontend
    res.json(rows.map((u) => ({ ...u, clientId: u.client_id, client_id: undefined })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users — admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, username, password, role, clientId } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'Name, username and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, username, password, role, client_id) VALUES (?, ?, ?, ?, ?)',
      [name, username, hashed, role || 'vendor', clientId || null]
    );
    const [rows] = await db.query(
      'SELECT id, name, username, role, client_id FROM users WHERE username = ?', [username]
    );
    const u = rows[0];
    res.status(201).json({ ...u, clientId: u.client_id, client_id: undefined });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id — admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, password, role, clientId } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET name = ?, password = ?, role = ?, client_id = ? WHERE id = ?',
        [name, hashed, role, clientId || null, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE users SET name = ?, role = ?, client_id = ? WHERE id = ?',
        [name, role, clientId || null, req.params.id]
      );
    }
    const [rows] = await db.query(
      'SELECT id, name, username, role, client_id FROM users WHERE id = ?', [req.params.id]
    );
    const u = rows[0];
    res.json({ ...u, clientId: u.client_id, client_id: undefined });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id — admin only (cannot delete last admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    const target   = await db.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (target[0][0]?.role === 'admin' && admins.length === 1)
      return res.status(400).json({ error: 'Cannot delete the last admin' });

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
