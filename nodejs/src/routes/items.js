const express = require('express');
const db      = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router  = express.Router();

// GET /api/items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_items ORDER BY category, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/items
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { name, unit, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const id = 'G' + Date.now();
    await db.query(
      'INSERT INTO grocery_items (id, name, unit, category) VALUES (?, ?, ?, ?)',
      [id, name, unit || 'kg', category || 'Others']
    );
    const [rows] = await db.query('SELECT * FROM grocery_items WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/items/:id
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, unit, category } = req.body;
  try {
    await db.query(
      'UPDATE grocery_items SET name = ?, unit = ?, category = ? WHERE id = ?',
      [name, unit, category, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM grocery_items WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM grocery_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
