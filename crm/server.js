const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const total_leads = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const monthly_revenue = db.prepare(
    "SELECT COALESCE(SUM(amount),0) as r FROM jobs WHERE status='completed' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
  ).get().r;
  const jobs_booked = db.prepare(
    "SELECT COUNT(*) as c FROM jobs WHERE status IN ('booked','in_progress','completed')"
  ).get().c;
  const converted = db.prepare(
    "SELECT COUNT(*) as c FROM leads WHERE status IN ('booked','completed')"
  ).get().c;
  const conversion_rate = total_leads > 0 ? (converted / total_leads) * 100 : 0;

  const jobs_by_status = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status ORDER BY status').all();

  const monthly_trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM leads
    WHERE created_at >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  const recent_leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5').all();

  res.json({ total_leads, monthly_revenue, jobs_booked, conversion_rate, jobs_by_status, monthly_trend, recent_leads });
});

// Leads
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (search) {
    sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/leads', (req, res) => {
  const { first_name, last_name, email, phone, service_type, status, source, address, notes, estimated_value } = req.body;
  const result = db.prepare(`
    INSERT INTO leads (first_name, last_name, email, phone, service_type, status, source, address, notes, estimated_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(first_name, last_name, email || null, phone || null, service_type || null, status || 'new', source || null, address || null, notes || null, estimated_value || 0);
  res.json(db.prepare('SELECT * FROM leads WHERE id=?').get(result.lastInsertRowid));
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Not found' });
  const activities = db.prepare('SELECT * FROM activities WHERE lead_id=? ORDER BY created_at ASC').all(lead.id);
  const jobs = db.prepare('SELECT * FROM jobs WHERE lead_id=? ORDER BY created_at DESC').all(lead.id);
  res.json({ ...lead, activities, jobs });
});

app.put('/api/leads/:id', (req, res) => {
  const { first_name, last_name, email, phone, service_type, status, source, address, notes, estimated_value } = req.body;
  db.prepare(`
    UPDATE leads SET first_name=?, last_name=?, email=?, phone=?, service_type=?, status=?, source=?, address=?, notes=?, estimated_value=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(first_name, last_name, email || null, phone || null, service_type || null, status, source || null, address || null, notes || null, estimated_value || 0, req.params.id);
  res.json(db.prepare('SELECT * FROM leads WHERE id=?').get(req.params.id));
});

app.delete('/api/leads/:id', (req, res) => {
  db.prepare('DELETE FROM activities WHERE lead_id=?').run(req.params.id);
  db.prepare('DELETE FROM jobs WHERE lead_id=?').run(req.params.id);
  db.prepare('DELETE FROM leads WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Jobs
app.get('/api/jobs', (req, res) => {
  const { status, date_from, date_to } = req.query;
  let sql = `SELECT j.*, l.first_name, l.last_name FROM jobs j LEFT JOIN leads l ON j.lead_id = l.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND j.status=?'; params.push(status); }
  if (date_from) { sql += ' AND j.scheduled_date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND j.scheduled_date <= ?'; params.push(date_to); }
  sql += ' ORDER BY j.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/jobs', (req, res) => {
  const { lead_id, title, status, service_type, scheduled_date, scheduled_time, address, amount, paid, crew, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO jobs (lead_id, title, status, service_type, scheduled_date, scheduled_time, address, amount, paid, crew, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(lead_id || null, title, status || 'new', service_type || null, scheduled_date || null, scheduled_time || null, address || null, amount || 0, paid ? 1 : 0, crew || null, notes || null);
  res.json(db.prepare('SELECT j.*, l.first_name, l.last_name FROM jobs j LEFT JOIN leads l ON j.lead_id=l.id WHERE j.id=?').get(result.lastInsertRowid));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT j.*, l.first_name, l.last_name FROM jobs j LEFT JOIN leads l ON j.lead_id=l.id WHERE j.id=?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const {
    lead_id = existing.lead_id,
    title = existing.title,
    status = existing.status,
    service_type = existing.service_type,
    scheduled_date = existing.scheduled_date,
    scheduled_time = existing.scheduled_time,
    address = existing.address,
    amount = existing.amount,
    paid = existing.paid,
    crew = existing.crew,
    notes = existing.notes
  } = req.body;
  db.prepare(`
    UPDATE jobs SET lead_id=?, title=?, status=?, service_type=?, scheduled_date=?, scheduled_time=?, address=?, amount=?, paid=?, crew=?, notes=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(lead_id, title, status, service_type, scheduled_date, scheduled_time, address, amount, paid ? 1 : 0, crew, notes, req.params.id);
  res.json(db.prepare('SELECT j.*, l.first_name, l.last_name FROM jobs j LEFT JOIN leads l ON j.lead_id=l.id WHERE j.id=?').get(req.params.id));
});

app.delete('/api/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Calendar
app.get('/api/calendar', (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, l.first_name, l.last_name
    FROM jobs j LEFT JOIN leads l ON j.lead_id = l.id
    WHERE j.scheduled_date IS NOT NULL AND j.scheduled_date != ''
    ORDER BY j.scheduled_date ASC, j.scheduled_time ASC
  `).all();
  res.json(jobs);
});

// Activities
app.post('/api/activities', (req, res) => {
  const { lead_id, job_id, type, description } = req.body;
  const result = db.prepare('INSERT INTO activities (lead_id, job_id, type, description) VALUES (?,?,?,?)').run(lead_id || null, job_id || null, type || 'note', description);
  res.json(db.prepare('SELECT * FROM activities WHERE id=?').get(result.lastInsertRowid));
});

app.listen(3001, () => console.log('204 JunkPros CRM running at http://localhost:3001'));
