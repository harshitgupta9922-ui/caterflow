// ============================================================
// CaterFlow Backend — server.js
// Node.js + Express + MySQL
// Updated: Apr 6, 2026 - Profit MIS Feature
// ============================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mysql      = require('mysql2/promise');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 10000;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// ── DATABASE POOL ─────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     || 'caterflow',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit:    10,
});

// Test DB connection on startup
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ MySQL connected');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
})();

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ── HELPER ───────────────────────────────────────────────────
const ok  = (res, data)    => res.json({ success: true, data });
const err = (res, msg, code = 400) => res.status(code).json({ success: false, error: msg });

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return err(res, 'Username and password required');

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );
    if (!rows.length) return err(res, 'Invalid credentials', 401);

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return err(res, 'Invalid credentials', 401);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name, clientId: user.client_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    ok(res, {
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, clientId: user.client_id }
    });
  } catch (e) {
    console.error(e);
    err(res, 'Server error', 500);
  }
});

// ============================================================
// CLIENTS
// ============================================================

// GET /api/clients
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clients ORDER BY name');
    ok(res, rows);
  } catch (e) { err(res, 'Server error', 500); }
});

// POST /api/clients
app.post('/api/clients', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, type, location } = req.body;
    if (!name || !location) return err(res, 'Name and location required');
    const id = uuidv4();
    await db.query('INSERT INTO clients (id, name, type, location) VALUES (?, ?, ?, ?)',
      [id, name, type || 'Hospital', location]);
    ok(res, { id, name, type: type || 'Hospital', location });
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// PUT /api/clients/:id
app.put('/api/clients/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, type, location } = req.body;
    if (!name || !location) return err(res, 'Name and location required');
    await db.query('UPDATE clients SET name=?, type=?, location=? WHERE id=?',
      [name, type, location, req.params.id]);
    ok(res, { id: req.params.id, name, type, location });
  } catch (e) { err(res, 'Server error', 500); }
});

// DELETE /api/clients/:id
app.delete('/api/clients/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM clients WHERE id=?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { err(res, 'Server error', 500); }
});

// ============================================================
// GROCERY ITEMS
// ============================================================

// GET /api/items
app.get('/api/items', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grocery_items ORDER BY category, name');
    ok(res, rows);
  } catch (e) { err(res, 'Server error', 500); }
});

// POST /api/items
app.post('/api/items', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, unit, category } = req.body;
    if (!name) return err(res, 'Name required');
    const id = uuidv4();
    await db.query('INSERT INTO grocery_items (id, name, unit, category) VALUES (?, ?, ?, ?)',
      [id, name, unit || 'kg', category || 'Others']);
    ok(res, { id, name, unit: unit || 'kg', category: category || 'Others' });
  } catch (e) { err(res, 'Server error', 500); }
});

// PUT /api/items/:id
app.put('/api/items/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, unit, category } = req.body;
    if (!name) return err(res, 'Name required');
    await db.query('UPDATE grocery_items SET name=?, unit=?, category=? WHERE id=?',
      [name, unit, category, req.params.id]);
    ok(res, { id: req.params.id, name, unit, category });
  } catch (e) { err(res, 'Server error', 500); }
});

// DELETE /api/items/:id
app.delete('/api/items/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM grocery_items WHERE id=?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { err(res, 'Server error', 500); }
});

// ============================================================
// USERS
// ============================================================

// GET /api/users
app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, username, role, client_id as clientId, created_at FROM users ORDER BY role DESC, name'
    );
    ok(res, rows);
  } catch (e) { err(res, 'Server error', 500); }
});

// POST /api/users
app.post('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, username, password, role, clientId } = req.body;
    if (!name || !username || !password) return err(res, 'Name, username and password required');

    const [exists] = await db.query('SELECT id FROM users WHERE username=?', [username]);
    if (exists.length) return err(res, 'Username already taken');

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, username, password, role, client_id) VALUES (?, ?, ?, ?, ?)',
      [name, username, hashed, role || 'vendor', clientId || null]
    );
    ok(res, { id: result.insertId, name, username, role: role || 'vendor', clientId: clientId || null });
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// PUT /api/users/:id
app.put('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, password, role, clientId } = req.body;
    if (!name) return err(res, 'Name required');

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name=?, password=?, role=?, client_id=? WHERE id=?',
        [name, hashed, role, clientId || null, req.params.id]);
    } else {
      await db.query('UPDATE users SET name=?, role=?, client_id=? WHERE id=?',
        [name, role, clientId || null, req.params.id]);
    }
    ok(res, { id: parseInt(req.params.id), name, role, clientId: clientId || null });
  } catch (e) { err(res, 'Server error', 500); }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Prevent deleting last admin
    const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
    const [target] = await db.query('SELECT role FROM users WHERE id=?', [req.params.id]);
    if (target[0]?.role === 'admin' && admins.length === 1)
      return err(res, 'Cannot delete the last admin');

    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { err(res, 'Server error', 500); }
});

// ============================================================
// PURCHASES
// ============================================================

// GET /api/purchases  (admin: all, vendor: own only)
app.get('/api/purchases', authMiddleware, async (req, res) => {
  try {
    const { clientId, month } = req.query;
    let sql = `
      SELECT p.*, GROUP_CONCAT(
        JSON_OBJECT(
          'groceryId', pi.grocery_id,
          'qty',       pi.qty,
          'rate',      pi.rate,
          'total',     pi.total
        )
      ) as items_json
      FROM purchases p
      LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'vendor') {
      sql += ' AND p.added_by = ?'; params.push(req.user.username);
    } else {
      if (clientId && clientId !== 'ALL') { sql += ' AND p.client_id = ?'; params.push(clientId); }
    }
    if (month) { sql += ' AND DATE_FORMAT(p.date, "%Y-%m") = ?'; params.push(month); }

    sql += ' GROUP BY p.id ORDER BY p.date DESC, p.id DESC';

    const [rows] = await db.query(sql, params);

    // Parse items_json
    const purchases = rows.map((r) => ({
      id:          r.id,
      clientId:    r.client_id,
      date:        r.date.toISOString().split('T')[0],
      peopleCount: r.people_count,
      totalAmount: parseFloat(r.total_amount),
      addedBy:     r.added_by,
      items:       r.items_json
        ? r.items_json.split('},{').map((s) => {
            try { return JSON.parse(s.startsWith('{') ? s : '{' + s); } catch { return null; }
          }).filter(Boolean).map((i) => ({ ...i, qty: parseFloat(i.qty), rate: parseFloat(i.rate), total: parseFloat(i.total) }))
        : [],
    }));

    ok(res, purchases);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// POST /api/purchases
app.post('/api/purchases', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { clientId, date, peopleCount, items } = req.body;
    if (!clientId || !date || !items?.length) return err(res, 'clientId, date and items required');

    const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO purchases (client_id, date, people_count, total_amount, added_by) VALUES (?, ?, ?, ?, ?)',
      [clientId, date, peopleCount || 0, totalAmount, req.user.username]
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, grocery_id, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
        [purchaseId, item.groceryId, item.qty, item.rate, item.qty * item.rate]
      );
    }

    await conn.commit();
    ok(res, { id: purchaseId, clientId, date, peopleCount, totalAmount, addedBy: req.user.username, items });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    err(res, 'Server error', 500);
  } finally {
    conn.release();
  }
});

// PUT /api/purchases/:id — admin or vendor can edit their own
app.put('/api/purchases/:id', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { clientId, date, peopleCount, items } = req.body;
    if (!items?.length) return err(res, 'Items required');

    // Check ownership for vendors
    const [purchase] = await db.query('SELECT added_by, client_id FROM purchases WHERE id = ?', [req.params.id]);
    if (!purchase[0]) return err(res, 'Purchase not found', 404);

    if (req.user.role === 'vendor') {
      if (purchase[0].added_by !== req.user.username) {
        return err(res, 'You can only edit your own entries', 403);
      }
      if (clientId !== req.user.clientId) {
        return err(res, 'You can only edit entries for your assigned client', 403);
      }
    }

    const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    await conn.beginTransaction();

    await conn.query(
      'UPDATE purchases SET client_id=?, date=?, people_count=?, total_amount=? WHERE id=?',
      [clientId, date, peopleCount || 0, totalAmount, req.params.id]
    );
    await conn.query('DELETE FROM purchase_items WHERE purchase_id=?', [req.params.id]);

    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, grocery_id, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, item.groceryId, item.qty, item.rate, item.qty * item.rate]
      );
    }

    await conn.commit();
    ok(res, { id: parseInt(req.params.id), clientId, date, peopleCount, totalAmount, addedBy: req.user.username, items });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    err(res, 'Server error', 500);
  } finally {
    conn.release();
  }
});

// DELETE /api/purchases/:id — admin or vendor can delete their own
app.delete('/api/purchases/:id', authMiddleware, async (req, res) => {
  try {
    const [purchase] = await db.query('SELECT added_by FROM purchases WHERE id = ?', [req.params.id]);
    if (!purchase[0]) return err(res, 'Purchase not found', 404);

    if (req.user.role === 'vendor' && purchase[0].added_by !== req.user.username) {
      return err(res, 'You can only delete your own entries', 403);
    }

    await db.query('DELETE FROM purchases WHERE id=?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) {
    console.error(e);
    err(res, 'Server error', 500);
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── SETUP DATABASE ────────────────────────────────────────────
app.post('/api/setup', async (req, res) => {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        client_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(100),
        monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        INDEX idx_client (client_id)
      )`,
      `CREATE TABLE IF NOT EXISTS sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        client_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        description VARCHAR(255),
        entry_type ENUM('lump_sum', 'detailed') NOT NULL DEFAULT 'lump_sum',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        INDEX idx_client (client_id),
        INDEX idx_date (date)
      )`,
      `CREATE TABLE IF NOT EXISTS sales_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sale_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        qty DECIMAL(10,2) NOT NULL,
        rate DECIMAL(10,2) NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      )`
    ];

    for (const sql of tables) {
      await db.query(sql);
    }
    res.json({ success: true, message: 'Database tables created successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 CaterFlow API running on 0.0.0.0:${PORT}`));

// ============================================================
// RETURN ENTRIES (ENDPOINTS BELOW)
// ============================================================

// GET /api/returns
app.get('/api/returns', authMiddleware, async (req, res) => {
  try {
    const { clientId, month } = req.query;
    let sql = `
      SELECT r.*, GROUP_CONCAT(
        JSON_OBJECT(
          'groceryId', ri.grocery_id,
          'qty',       ri.qty,
          'rate',      ri.rate,
          'total',     ri.total
        )
      ) as items_json
      FROM return_entries r
      LEFT JOIN return_items ri ON ri.return_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'vendor') {
      sql += ' AND r.added_by = ?'; params.push(req.user.username);
    } else {
      if (clientId && clientId !== 'ALL') { sql += ' AND r.client_id = ?'; params.push(clientId); }
    }
    if (month) { sql += ' AND DATE_FORMAT(r.date, "%Y-%m") = ?'; params.push(month); }
    sql += ' GROUP BY r.id ORDER BY r.date DESC, r.id DESC';

    const [rows] = await db.query(sql, params);
    const returns = rows.map((r) => ({
      id:          r.id,
      clientId:    r.client_id,
      date:        r.date.toISOString().split('T')[0],
      totalAmount: parseFloat(r.total_amount),
      addedBy:     r.added_by,
      items:       r.items_json
        ? r.items_json.split('},{').map((s) => {
            try { return JSON.parse(s.startsWith('{') ? s : '{' + s); } catch { return null; }
          }).filter(Boolean).map((i) => ({ ...i, qty: parseFloat(i.qty), rate: parseFloat(i.rate), total: parseFloat(i.total) }))
        : [],
    }));
    ok(res, returns);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// POST /api/returns
app.post('/api/returns', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { clientId, date, items } = req.body;
    if (!clientId || !date || !items?.length) return err(res, 'clientId, date and items required');
    const totalAmount = items.reduce((s, i) => s + (i.qty * i.rate), 0);
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO return_entries (client_id, date, total_amount, added_by) VALUES (?, ?, ?, ?)',
      [clientId, date, totalAmount, req.user.username]
    );
    const returnId = result.insertId;
    for (const item of items) {
      await conn.query(
        'INSERT INTO return_items (return_id, grocery_id, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
        [returnId, item.groceryId, item.qty, item.rate, item.qty * item.rate]
      );
    }
    await conn.commit();
    ok(res, { id: returnId, clientId, date, totalAmount, addedBy: req.user.username, items });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    err(res, 'Server error', 500);
  } finally {
    conn.release();
  }
});

// DELETE /api/returns/:id
app.delete('/api/returns/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM return_entries WHERE id=?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { err(res, 'Server error', 500); }
});

// ============================================================
// EMPLOYEES
// ============================================================

// GET /api/employees - admin only
app.get('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { clientId } = req.query;
    let sql = 'SELECT id, client_id as clientId, name, position, monthly_salary as monthlySalary FROM employees WHERE 1=1';
    const params = [];
    if (clientId) { sql += ' AND client_id = ?'; params.push(clientId); }
    sql += ' ORDER BY client_id, name';
    const [rows] = await db.query(sql, params);
    ok(res, rows);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// POST /api/employees - admin only
app.post('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { clientId, name, position, monthlySalary } = req.body;
    if (!clientId || !name) return err(res, 'clientId and name required');
    const [result] = await db.query(
      'INSERT INTO employees (client_id, name, position, monthly_salary) VALUES (?, ?, ?, ?)',
      [clientId, name, position || null, monthlySalary || 0]
    );
    ok(res, { id: result.insertId, clientId, name, position, monthlySalary: monthlySalary || 0 }, 201);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// PUT /api/employees/:id - admin only
app.put('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, position, monthlySalary } = req.body;
    if (!name) return err(res, 'name required');
    await db.query(
      'UPDATE employees SET name = ?, position = ?, monthly_salary = ? WHERE id = ?',
      [name, position || null, monthlySalary || 0, req.params.id]
    );
    const [rows] = await db.query('SELECT id, client_id as clientId, name, position, monthly_salary as monthlySalary FROM employees WHERE id = ?', [req.params.id]);
    ok(res, rows[0]);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// DELETE /api/employees/:id - admin only
app.delete('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// ============================================================
// SALES
// ============================================================

// GET /api/sales - admin only
app.get('/api/sales', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { clientId, month } = req.query;
    let sql = `SELECT s.*, GROUP_CONCAT(
      JSON_OBJECT(
        'itemName', si.item_name,
        'qty', si.qty,
        'rate', si.rate,
        'total', si.total
      )
    ) as items_json
    FROM sales s
    LEFT JOIN sales_items si ON si.sale_id = s.id
    WHERE 1=1`;
    const params = [];
    if (clientId) { sql += ' AND s.client_id = ?'; params.push(clientId); }
    if (month) { sql += ' AND DATE_FORMAT(s.date, "%Y-%m") = ?'; params.push(month); }
    sql += ' GROUP BY s.id ORDER BY s.date DESC';

    const [rows] = await db.query(sql, params);
    const sales = rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      date: r.date.toISOString().split('T')[0],
      totalAmount: parseFloat(r.total_amount),
      description: r.description,
      entryType: r.entry_type,
      items: r.items_json
        ? r.items_json.split('},{').map((s) => {
            try { return JSON.parse(s.startsWith('{') ? s : '{' + s); } catch { return null; }
          }).filter(Boolean).map((i) => ({ ...i, qty: parseFloat(i.qty), rate: parseFloat(i.rate), total: parseFloat(i.total) }))
        : []
    }));
    ok(res, sales);
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// POST /api/sales - admin only
app.post('/api/sales', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { clientId, date, totalAmount, description, entryType, items } = req.body;
    if (!clientId || !date) return err(res, 'clientId and date required');

    const finalAmount = entryType === 'detailed' && items
      ? items.reduce((s, i) => s + (i.qty * i.rate), 0)
      : (totalAmount || 0);

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO sales (client_id, date, total_amount, description, entry_type) VALUES (?, ?, ?, ?, ?)',
      [clientId, date, finalAmount, description || null, entryType || 'lump_sum']
    );

    if (entryType === 'detailed' && items && items.length > 0) {
      for (const item of items) {
        await conn.query(
          'INSERT INTO sales_items (sale_id, item_name, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
          [result.insertId, item.itemName, item.qty, item.rate, item.qty * item.rate]
        );
      }
    }
    await conn.commit();
    ok(res, { id: result.insertId, clientId, date, totalAmount: finalAmount, description, entryType, items: items || [] }, 201);
  } catch (e) {
    await conn.rollback();
    console.error(e);
    err(res, 'Server error', 500);
  } finally {
    conn.release();
  }
});

// PUT /api/sales/:id - admin only
app.put('/api/sales/:id', authMiddleware, adminOnly, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { clientId, date, totalAmount, description, entryType, items } = req.body;
    if (!clientId || !date) return err(res, 'clientId and date required');

    const finalAmount = entryType === 'detailed' && items
      ? items.reduce((s, i) => s + (i.qty * i.rate), 0)
      : (totalAmount || 0);

    await conn.beginTransaction();
    await conn.query(
      'UPDATE sales SET client_id = ?, date = ?, total_amount = ?, description = ?, entry_type = ? WHERE id = ?',
      [clientId, date, finalAmount, description || null, entryType || 'lump_sum', req.params.id]
    );

    // Clear old items if detailed
    await conn.query('DELETE FROM sales_items WHERE sale_id = ?', [req.params.id]);

    // Add new items if detailed
    if (entryType === 'detailed' && items && items.length > 0) {
      for (const item of items) {
        await conn.query(
          'INSERT INTO sales_items (sale_id, item_name, qty, rate, total) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, item.itemName, item.qty, item.rate, item.qty * item.rate]
        );
      }
    }
    await conn.commit();
    ok(res, { id: parseInt(req.params.id), clientId, date, totalAmount: finalAmount, description, entryType, items: items || [] });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    err(res, 'Server error', 500);
  } finally {
    conn.release();
  }
});

// DELETE /api/sales/:id - admin only
app.delete('/api/sales/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    ok(res, { deleted: req.params.id });
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// ============================================================
// MIS (Management Information System)
// ============================================================

// GET /api/mis - admin only
app.get('/api/mis', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { clientId, month } = req.query;
    if (!clientId || !month) return err(res, 'clientId and month required');

    // Get sales total
    const [saleRows] = await db.query(
      'SELECT SUM(total_amount) as total FROM sales WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
      [clientId, month]
    );
    const revenue = parseFloat(saleRows[0]?.total || 0);

    // Get purchases total
    const [purchaseRows] = await db.query(
      'SELECT SUM(total_amount) as total FROM purchases WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
      [clientId, month]
    );
    const purchases = parseFloat(purchaseRows[0]?.total || 0);

    // Get returns total
    const [returnRows] = await db.query(
      'SELECT SUM(total_amount) as total FROM return_entries WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
      [clientId, month]
    );
    const returns = parseFloat(returnRows[0]?.total || 0);

    // Get salaries total
    const [salaryRows] = await db.query(
      'SELECT SUM(monthly_salary) as total FROM employees WHERE client_id = ?',
      [clientId]
    );
    const salaries = parseFloat(salaryRows[0]?.total || 0);

    const totalExpenses = purchases + returns + salaries;
    const netProfit = revenue - totalExpenses;

    // Get counts
    const [countRows] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM sales WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?) as salesCount,
        (SELECT COUNT(*) FROM purchases WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?) as purchaseCount,
        (SELECT COUNT(*) FROM return_entries WHERE client_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?) as returnCount,
        (SELECT COUNT(*) FROM employees WHERE client_id = ?) as employeeCount
    `, [clientId, month, clientId, month, clientId, month, clientId]);

    ok(res, {
      clientId,
      month,
      revenue,
      expenses: {
        purchases,
        returns,
        salaries
      },
      totalExpenses,
      netProfit,
      details: {
        salesCount: countRows[0].salesCount || 0,
        purchaseCount: countRows[0].purchaseCount || 0,
        returnCount: countRows[0].returnCount || 0,
        employeeCount: countRows[0].employeeCount || 0
      }
    });
  } catch (e) { console.error(e); err(res, 'Server error', 500); }
});

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));


