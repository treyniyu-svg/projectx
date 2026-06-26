'use strict'
const express = require('express')
const Database = require('better-sqlite3')
const multer = require('multer')
const Anthropic = require('@anthropic-ai/sdk')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  }
})

// ─── Database ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'junkpro.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT,
    status TEXT DEFAULT 'draft',
    load_pct REAL DEFAULT 0,
    load_label TEXT DEFAULT '',
    items TEXT DEFAULT '[]',
    access_modifier TEXT DEFAULT 'standard',
    access_multiplier REAL DEFAULT 1.0,
    dense_materials TEXT DEFAULT '[]',
    hazmat_items TEXT DEFAULT '[]',
    base_price REAL DEFAULT 0,
    items_price REAL DEFAULT 0,
    surcharges REAL DEFAULT 0,
    estimated_dump_fee REAL DEFAULT 85,
    total REAL DEFAULT 0,
    estimated_labor REAL DEFAULT 0,
    estimated_fuel REAL DEFAULT 0,
    estimated_margin REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    ai_analysis TEXT DEFAULT '',
    photo_path TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estimate_id INTEGER REFERENCES estimates(id),
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT,
    truck_id INTEGER REFERENCES trucks(id),
    crew TEXT DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    scheduled_date TEXT,
    scheduled_time TEXT,
    completed_at TEXT,
    actual_dump_fee REAL,
    actual_load_pct REAL,
    revenue REAL DEFAULT 0,
    before_photo TEXT DEFAULT '',
    after_photo TEXT DEFAULT '',
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trucks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity_yards REAL DEFAULT 15,
    plate TEXT DEFAULT '',
    color TEXT DEFAULT '',
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS crew_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'crew',
    phone TEXT DEFAULT '',
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER REFERENCES jobs(id),
    estimate_id INTEGER REFERENCES estimates(id),
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'unpaid',
    payment_method TEXT DEFAULT '',
    paid_at TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// Default settings
const DEFAULTS = {
  load_rates: JSON.stringify({ eighth: 150, quarter: 250, half: 400, three_quarter: 525, full: 700 }),
  access_modifiers: JSON.stringify({ standard: 1.0, stairs: 1.20, long_carry: 1.15, elevator: 1.10 }),
  item_prices: JSON.stringify({
    'Mattress (Single)': 50, 'Mattress (Double)': 60, 'Mattress (Queen)': 70, 'Mattress (King)': 80,
    'Sofa/Couch': 100, 'Loveseat': 80, 'Chair/Recliner': 60,
    'Dresser': 75, 'Desk': 70, 'Bookshelf': 50, 'Dining Table': 80, 'Dining Chair': 25,
    'Fridge': 100, 'Washer': 80, 'Dryer': 80, 'Stove/Oven': 80, 'Dishwasher': 70,
    'TV (< 40")': 40, 'TV (40"+)': 60, 'Computer/Monitor': 40,
    'Treadmill': 100, 'Exercise Bike': 60, 'Hot Tub': 300,
    'Shed (small)': 400, 'Deck (per section)': 200, 'Fence (per section)': 150,
    'Yard Waste (bag)': 10, 'Box of Misc': 15
  }),
  dense_surcharges: JSON.stringify({
    'Concrete': 75, 'Dirt/Soil': 75, 'Shingles': 60,
    'Tile': 60, 'Books/Paper': 40, 'Plaster': 60, 'Gravel': 75, 'Bricks': 75
  }),
  hazmat_surcharges: JSON.stringify({
    'Fridge (Freon removal)': 25, 'AC Unit': 25, 'CRT TV': 30,
    'Paint Cans (per)': 20, 'Batteries (per)': 15, 'Tires (per)': 10
  }),
  labor_rate_per_crew: JSON.stringify(35),
  avg_crew_per_job: JSON.stringify(2),
  avg_job_hours: JSON.stringify(2),
  fuel_per_job: JSON.stringify(25),
  default_dump_fee: JSON.stringify(85),
  company: JSON.stringify({
    name: '204 JunkPros', phone: '(204) 292-0971',
    address: 'Winnipeg, MB', email: 'info@204junkpros.com'
  })
}

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
for (const [k, v] of Object.entries(DEFAULTS)) insertSetting.run(k, v)

// Seed trucks & crew if empty
if (!db.prepare('SELECT COUNT(*) as c FROM trucks').get().c) {
  db.prepare('INSERT INTO trucks (name, capacity_yards, plate, color) VALUES (?, ?, ?, ?)').run('Truck 1', 15, 'MAN-204', '#78C828')
  db.prepare('INSERT INTO trucks (name, capacity_yards, plate, color) VALUES (?, ?, ?, ?)').run('Truck 2', 15, 'MAN-205', '#0A0A0A')
}
if (!db.prepare('SELECT COUNT(*) as c FROM crew_members').get().c) {
  db.prepare('INSERT INTO crew_members (name, role, phone) VALUES (?, ?, ?)').run('Owner', 'owner', '(204) 292-0971')
  db.prepare('INSERT INTO crew_members (name, role, phone) VALUES (?, ?, ?)').run('Crew Member 1', 'crew', '')
  db.prepare('INSERT INTO crew_members (name, role, phone) VALUES (?, ?, ?)').run('Crew Member 2', 'crew', '')
}

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

// ─── AI Photo Analysis ────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/analyze-photo', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' })
  try {
    const imageData = fs.readFileSync(req.file.path)
    const base64 = imageData.toString('base64')
    const mediaType = req.file.mimetype

    const itemPrices = getSetting('item_prices') || {}
    const denseList = Object.keys(getSetting('dense_surcharges') || {}).join(', ')
    const hazmatList = Object.keys(getSetting('hazmat_surcharges') || {}).join(', ')
    const knownItems = Object.keys(itemPrices).join(', ')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `You are an expert junk removal estimator. Analyze this photo and return ONLY valid JSON (no markdown, no explanation).

Estimate what percentage of a standard 15 cubic yard junk removal truck this load would fill.

Known items to identify: ${knownItems}
Dense/heavy materials to flag: ${denseList}
Hazmat items to flag: ${hazmatList}

Return this exact JSON structure:
{
  "load_pct": <number 0-100>,
  "load_label": "<one of: 1/8 load, 1/4 load, 1/2 load, 3/4 load, Full load>",
  "detected_items": [{"name": "<item name from known items list>", "qty": <number>}],
  "dense_materials": ["<material name if present>"],
  "hazmat_items": ["<hazmat item if present>"],
  "density_warning": <true|false>,
  "confidence": "<high|medium|low>",
  "notes": "<brief observations about the load>"
}`
          }
        ]
      }]
    })

    const text = response.content[0].text.trim()
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      analysis = match ? JSON.parse(match[0]) : { load_pct: 25, load_label: '1/4 load', detected_items: [], dense_materials: [], hazmat_items: [], density_warning: false, confidence: 'low', notes: 'Could not parse response' }
    }

    // Keep photo path for saving with estimate
    analysis.photo_path = req.file.filename
    res.json(analysis)
  } catch (err) {
    console.error('Claude API error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── Customers ────────────────────────────────────────────────────────────────
app.get('/api/customers', (req, res) => {
  const q = req.query.q
  let rows
  if (q) rows = db.prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name").all(`%${q}%`, `%${q}%`, `%${q}%`)
  else rows = db.prepare('SELECT * FROM customers ORDER BY name').all()
  res.json(rows)
})

app.post('/api/customers', (req, res) => {
  const { name, email, phone, address, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })
  const r = db.prepare('INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)').run(name, email || '', phone || '', address || '', notes || '')
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid))
})

app.get('/api/customers/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
  if (!c) return res.status(404).json({ error: 'Not found' })
  const jobs = db.prepare('SELECT * FROM jobs WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)
  const estimates = db.prepare('SELECT * FROM estimates WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)
  res.json({ ...c, jobs, estimates })
})

app.put('/api/customers/:id', (req, res) => {
  const { name, email, phone, address, notes } = req.body
  db.prepare('UPDATE customers SET name=?, email=?, phone=?, address=?, notes=? WHERE id=?').run(name, email || '', phone || '', address || '', notes || '', req.params.id)
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id))
})

app.delete('/api/customers/:id', (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ─── Estimates ────────────────────────────────────────────────────────────────
app.get('/api/estimates', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, c.name as cname, c.phone as cphone
    FROM estimates e LEFT JOIN customers c ON e.customer_id = c.id
    ORDER BY e.created_at DESC LIMIT 200
  `).all()
  res.json(rows)
})

app.post('/api/estimates', (req, res) => {
  const d = req.body
  const labor = (getSetting('labor_rate_per_crew') || 35) * (getSetting('avg_crew_per_job') || 2) * (getSetting('avg_job_hours') || 2)
  const fuel = getSetting('fuel_per_job') || 25
  const margin = (d.total || 0) - labor - fuel - (d.estimated_dump_fee || 85)
  const r = db.prepare(`
    INSERT INTO estimates (customer_id, customer_name, status, load_pct, load_label, items, access_modifier,
      access_multiplier, dense_materials, hazmat_items, base_price, items_price, surcharges,
      estimated_dump_fee, total, estimated_labor, estimated_fuel, estimated_margin, notes, ai_analysis, photo_path)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    d.customer_id || null, d.customer_name || '', d.status || 'draft',
    d.load_pct || 0, d.load_label || '', JSON.stringify(d.items || []),
    d.access_modifier || 'standard', d.access_multiplier || 1.0,
    JSON.stringify(d.dense_materials || []), JSON.stringify(d.hazmat_items || []),
    d.base_price || 0, d.items_price || 0, d.surcharges || 0,
    d.estimated_dump_fee || 85, d.total || 0, labor, fuel, margin,
    d.notes || '', d.ai_analysis || '', d.photo_path || ''
  )
  res.json(db.prepare('SELECT * FROM estimates WHERE id = ?').get(r.lastInsertRowid))
})

app.get('/api/estimates/:id', (req, res) => {
  const e = db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id)
  if (!e) return res.status(404).json({ error: 'Not found' })
  res.json(e)
})

app.put('/api/estimates/:id', (req, res) => {
  const d = req.body
  const labor = (getSetting('labor_rate_per_crew') || 35) * (getSetting('avg_crew_per_job') || 2) * (getSetting('avg_job_hours') || 2)
  const fuel = getSetting('fuel_per_job') || 25
  const margin = (d.total || 0) - labor - fuel - (d.estimated_dump_fee || 85)
  db.prepare(`
    UPDATE estimates SET customer_id=?, customer_name=?, status=?, load_pct=?, load_label=?, items=?,
      access_modifier=?, access_multiplier=?, dense_materials=?, hazmat_items=?, base_price=?, items_price=?,
      surcharges=?, estimated_dump_fee=?, total=?, estimated_labor=?, estimated_fuel=?,
      estimated_margin=?, notes=?, photo_path=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    d.customer_id || null, d.customer_name || '', d.status || 'draft',
    d.load_pct || 0, d.load_label || '', JSON.stringify(d.items || []),
    d.access_modifier || 'standard', d.access_multiplier || 1.0,
    JSON.stringify(d.dense_materials || []), JSON.stringify(d.hazmat_items || []),
    d.base_price || 0, d.items_price || 0, d.surcharges || 0,
    d.estimated_dump_fee || 85, d.total || 0, labor, fuel, margin,
    d.notes || '', d.photo_path || '', req.params.id
  )
  res.json(db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id))
})

app.delete('/api/estimates/:id', (req, res) => {
  db.prepare('DELETE FROM estimates WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ─── Jobs ─────────────────────────────────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  const rows = db.prepare(`
    SELECT j.*, t.name as truck_name, t.color as truck_color
    FROM jobs j LEFT JOIN trucks t ON j.truck_id = t.id
    ORDER BY j.scheduled_date DESC, j.scheduled_time ASC
  `).all()
  res.json(rows)
})

app.post('/api/jobs', (req, res) => {
  const d = req.body
  const r = db.prepare(`
    INSERT INTO jobs (estimate_id, customer_id, customer_name, truck_id, crew, status,
      scheduled_date, scheduled_time, revenue, address, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    d.estimate_id || null, d.customer_id || null, d.customer_name || '',
    d.truck_id || null, JSON.stringify(d.crew || []),
    d.status || 'pending', d.scheduled_date || '', d.scheduled_time || '',
    d.revenue || 0, d.address || '', d.notes || ''
  )
  if (d.estimate_id) db.prepare("UPDATE estimates SET status='converted' WHERE id=?").run(d.estimate_id)
  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(r.lastInsertRowid))
})

app.put('/api/jobs/:id', (req, res) => {
  const d = req.body
  if (d.status === 'completed' && !d.completed_at) d.completed_at = new Date().toISOString()
  db.prepare(`
    UPDATE jobs SET truck_id=?, crew=?, status=?, scheduled_date=?, scheduled_time=?,
      completed_at=?, actual_dump_fee=?, actual_load_pct=?, revenue=?, address=?,
      before_photo=?, after_photo=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    d.truck_id || null, JSON.stringify(d.crew || []), d.status || 'pending',
    d.scheduled_date || '', d.scheduled_time || '', d.completed_at || null,
    d.actual_dump_fee || null, d.actual_load_pct || null, d.revenue || 0,
    d.address || '', d.before_photo || '', d.after_photo || '', d.notes || '',
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id))
})

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ─── Trucks & Crew ────────────────────────────────────────────────────────────
app.get('/api/trucks', (req, res) => res.json(db.prepare('SELECT * FROM trucks WHERE active=1').all()))
app.post('/api/trucks', (req, res) => {
  const { name, capacity_yards, plate, color } = req.body
  const r = db.prepare('INSERT INTO trucks (name, capacity_yards, plate, color) VALUES (?,?,?,?)').run(name, capacity_yards || 15, plate || '', color || '#78C828')
  res.json(db.prepare('SELECT * FROM trucks WHERE id=?').get(r.lastInsertRowid))
})
app.put('/api/trucks/:id', (req, res) => {
  const { name, capacity_yards, plate, color, active } = req.body
  db.prepare('UPDATE trucks SET name=?, capacity_yards=?, plate=?, color=?, active=? WHERE id=?').run(name, capacity_yards || 15, plate || '', color || '', active ?? 1, req.params.id)
  res.json(db.prepare('SELECT * FROM trucks WHERE id=?').get(req.params.id))
})

app.get('/api/crew', (req, res) => res.json(db.prepare('SELECT * FROM crew_members WHERE active=1').all()))
app.post('/api/crew', (req, res) => {
  const { name, role, phone } = req.body
  const r = db.prepare('INSERT INTO crew_members (name, role, phone) VALUES (?,?,?)').run(name, role || 'crew', phone || '')
  res.json(db.prepare('SELECT * FROM crew_members WHERE id=?').get(r.lastInsertRowid))
})
app.put('/api/crew/:id', (req, res) => {
  const { name, role, phone, active } = req.body
  db.prepare('UPDATE crew_members SET name=?, role=?, phone=?, active=? WHERE id=?').run(name, role || 'crew', phone || '', active ?? 1, req.params.id)
  res.json(db.prepare('SELECT * FROM crew_members WHERE id=?').get(req.params.id))
})

// ─── Invoices ─────────────────────────────────────────────────────────────────
app.get('/api/invoices', (req, res) => {
  res.json(db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all())
})
app.post('/api/invoices', (req, res) => {
  const d = req.body
  const r = db.prepare('INSERT INTO invoices (job_id, estimate_id, customer_id, customer_name, amount, status, notes) VALUES (?,?,?,?,?,?,?)').run(d.job_id || null, d.estimate_id || null, d.customer_id || null, d.customer_name || '', d.amount || 0, 'unpaid', d.notes || '')
  res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(r.lastInsertRowid))
})
app.put('/api/invoices/:id', (req, res) => {
  const { status, payment_method, notes, amount } = req.body
  const paid_at = status === 'paid' ? new Date().toISOString() : null
  db.prepare('UPDATE invoices SET status=?, payment_method=?, paid_at=?, notes=?, amount=? WHERE id=?').run(status, payment_method || '', paid_at, notes || '', amount || 0, req.params.id)
  res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id))
})

// ─── Settings ─────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all()
  const out = {}
  for (const r of rows) out[r.key] = JSON.parse(r.value)
  res.json(out)
})
app.put('/api/settings', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  for (const [k, v] of Object.entries(req.body)) upsert.run(k, JSON.stringify(v))
  const rows = db.prepare('SELECT * FROM settings').all()
  const out = {}
  for (const r of rows) out[r.key] = JSON.parse(r.value)
  res.json(out)
})

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const todayJobs = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(revenue),0) as rev FROM jobs WHERE scheduled_date=? AND status != 'cancelled'").get(today)
  const weekRev = db.prepare("SELECT COALESCE(SUM(revenue),0) as rev FROM jobs WHERE scheduled_date >= ? AND status='completed'").get(weekStart)
  const monthRev = db.prepare("SELECT COALESCE(SUM(revenue),0) as rev FROM jobs WHERE scheduled_date >= ? AND status='completed'").get(monthStart)
  const monthDump = db.prepare("SELECT COALESCE(SUM(actual_dump_fee),0) as fee FROM jobs WHERE scheduled_date >= ? AND status='completed'").get(monthStart)
  const monthLabor = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE scheduled_date >= ? AND status='completed'").get(monthStart)
  const pendingEst = db.prepare("SELECT COUNT(*) as c FROM estimates WHERE status IN ('draft','sent')").get()
  const allJobs = db.prepare("SELECT * FROM jobs WHERE scheduled_date >= ? ORDER BY scheduled_date, scheduled_time").all(today)
  const recentJobs = db.prepare(`
    SELECT j.*, t.name as truck_name FROM jobs j
    LEFT JOIN trucks t ON j.truck_id = t.id
    ORDER BY j.created_at DESC LIMIT 8
  `).all()

  const laborRate = (getSetting('labor_rate_per_crew') || 35) * (getSetting('avg_crew_per_job') || 2) * (getSetting('avg_job_hours') || 2)
  const fuelRate = getSetting('fuel_per_job') || 25
  const completedCount = monthLabor.c
  const estimatedCosts = completedCount * (laborRate + fuelRate) + (monthDump.fee || 0)
  const profit = (monthRev.rev || 0) - estimatedCosts

  res.json({
    today_jobs: todayJobs.c,
    today_revenue: todayJobs.rev,
    week_revenue: weekRev.rev,
    month_revenue: monthRev.rev,
    month_profit: profit,
    pending_estimates: pendingEst.c,
    upcoming_jobs: allJobs,
    recent_jobs: recentJobs
  })
})

// Photo upload for job before/after
app.post('/api/jobs/:id/photos', upload.fields([{ name: 'before' }, { name: 'after' }]), (req, res) => {
  const updates = {}
  if (req.files?.before) updates.before_photo = req.files.before[0].filename
  if (req.files?.after) updates.after_photo = req.files.after[0].filename
  if (Object.keys(updates).length) {
    const sets = Object.keys(updates).map(k => `${k}=?`).join(', ')
    db.prepare(`UPDATE jobs SET ${sets} WHERE id=?`).run(...Object.values(updates), req.params.id)
  }
  res.json({ ok: true, ...updates })
})

// ─── Serve CRM ────────────────────────────────────────────────────────────────
app.get('/crm', (req, res) => res.sendFile(path.join(__dirname, 'crm.html')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.listen(PORT, () => console.log(`204 JunkPro CRM running → http://localhost:${PORT}/crm`))
