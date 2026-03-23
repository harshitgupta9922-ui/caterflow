const express = require('express');
const db      = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router  = express.Router();

// ── Helper: fetch full purchase with items ──────────────────
async function getPurchaseById(id) {
  const [purchases] = await db.query('SELECT * FROM purchases WHERE id = ?', [id]);
  if (!purchases[0]) return null;
  const [items] = await db.query(
    'SELECT * FROM purchase_items WHERE purchase_id = ?', [id]
  );
  const p = purchases[0];
  return {
    id:          p.id,
    clientId:    p.client_id,
    date:        p.date.toISOString().split('T')[0],
    peopleCount: p.people_count,
    totalAmount: parseFloat(p.total_amount),
    addedBy:     p.added_by,
    items:       items.map((i) => ({
      groceryId: i.grocery_id,
      qty:       parseFloat(i.qty),
      rate:      parseFloat(i.rate),
      total:     parseFloat(i.total),
    })),
  };
}

// GET /api/purchases — filtered by client, month, vendor
router.get('/', authMiddleware, async (req, res) => {
  try {
    let sql    = 'SELECT * FROM purchases WHERE 1=1';
    const args = [];

    // Vendors only see their own entries
    if (req.user.role === 'vendor') {
      sql += ' AND added_by = ?'; args.push(req.user.username);
    }
    if (req.query.clientId) { sql += ' AND client_id = ?'; args.push(req.query.clientId); }
    if (req.query.month)    { sql += ' AND DATE_FORMAT(date, "%Y-%m") = ?'; args.push(req.query.month); }
    if (req.query.date)     { sql += ' AND date = ?'; args.push(req.query.date); }

    sql += ' ORDER BY date DESC, id DESC';

    const [purchases] = await db.query(sql, args);
    if (purchases.length === 0) return res.json([]);

    // Fetch all items for these purchases in one query
    const ids = purchases.map((p) => p.id);
    const [items] = await db.query(
      `SELECT * FROM purchase_items WHERE purchase_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    const itemsByPurchase = {};
    items.forEach((i) => {
      if (!itemsByPurchase[i.purchase_id]) itemsByPurchase[i.purchase_id] = [];
      itemsByPurchase[i.purchase_id].push({
        groceryId: i.grocery_id,
        qty:       parseFloat(i.qty),
        rate:      parseFloat(i.rate),
        total:     parseFloat(i.total),
      });
    });

    const result = purchases.map((p) => ({
      id:          p.id,
      clientId:    p.client_id,
      date:        p.date.toISOString().split('T')[0],
      peopleCount: p.people_count,
      totalAmount: parseFloat(p.total_amount),
      addedBy:     p.added_by,
      items:       itemsByPurchase[p.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/purchases — vendors and admins
router.post('/', authMiddleware, async (req, res) => {
  const { clientId, date, peopleCount, items } = req.body;
  if (!clientId || !date || !items?.length)
    return res.status(400).json({ error: 'clientId, date and items required' });

  // Vendors can only add for their own client
  if (req.user.role === 'vendor' && req.user.clientId !== clientId)
    return res.status(403).json({ error: 'You can only add entries for your assigned client' });

  try {
    const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    const [result]    = await db.query(
      'INSERT INTO purchases (client_id, date, people_count, total_amount, added_by) VALUES (?, ?, ?, ?, ?)',
      [clientId, date, peopleCount || 0, totalAmount, req.user.username]
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      await db.query(
        'INSERT INTO purchase_items (purchase_id, grocery_id, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
        [purchaseId, item.groceryId, item.qty, item.rate, item.qty * item.rate]
      );
    }

    const full = await getPurchaseById(purchaseId);
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/purchases/:id — admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { clientId, date, peopleCount, items } = req.body;
  try {
    const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    await db.query(
      'UPDATE purchases SET client_id = ?, date = ?, people_count = ?, total_amount = ? WHERE id = ?',
      [clientId, date, peopleCount || 0, totalAmount, req.params.id]
    );
    // Replace items
    await db.query('DELETE FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
    for (const item of items) {
      await db.query(
        'INSERT INTO purchase_items (purchase_id, grocery_id, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, item.groceryId, item.qty, item.rate, item.qty * item.rate]
      );
    }
    const full = await getPurchaseById(req.params.id);
    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/purchases/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
