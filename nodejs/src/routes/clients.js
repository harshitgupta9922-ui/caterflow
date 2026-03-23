const express = require('express');
const db      = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router  = express.Router();

// GET /api/clients — all users can fetch clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clients ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients — admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, type, location } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Name and location required' });
  try {
    const id = 'C' + Date.now();
    await db.query(
      'INSERT INTO clients (id, name, type, location) VALUES (?, ?, ?, ?)',
      [id, name, type || 'Hospital', location]
    );
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id — admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, type, location } = req.body;
  try {
    await db.query(
      'UPDATE clients SET name = ?, type = ?, location = ? WHERE id = ?',
      [name, type, location, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
