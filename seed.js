'use strict'
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'junkpro.db'))
db.pragma('journal_mode = WAL')

// Clear existing data
db.exec(`
  DELETE FROM invoices;
  DELETE FROM jobs;
  DELETE FROM estimates;
  DELETE FROM customers;
`)

// ─── Customers ────────────────────────────────────────────────────────────────
const insertCustomer = db.prepare(`INSERT INTO customers (name, email, phone, address, notes) VALUES (?, ?, ?, ?, ?)`)

const customers = [
  ['Sandra Kowalski',   'sandra.k@gmail.com',     '(204) 555-0101', '142 Elm St, River Heights, Winnipeg', 'Estate cleanout — very kind, referred by neighbour'],
  ['Marcus Thompson',   'marcus.t@outlook.com',   '(204) 555-0102', '88 Portage Ave, Downtown Winnipeg',   'Office reno debris, repeat customer'],
  ['Jamie Robertson',   'jamie.r@shaw.ca',         '(204) 555-0103', '34 St. Mary\'s Rd, St. Vital',        'Needed same-day, tipped crew well'],
  ['Debra Fontaine',    'debra@fontainerealty.ca', '(204) 555-0104', '610 Academy Rd, Tuxedo',              'Property manager — sends us jobs regularly'],
  ['Kevin Lalonde',     'klalonde@hotmail.com',    '(204) 555-0105', '21 Regent Ave W, Transcona',          'Shed demo + junk removal'],
  ['Patricia Mills',    'pmills@gmail.com',         '(204) 555-0106', '77 Henderson Hwy, East Kildonan',    'Full basement cleanout'],
  ['Tony Marchetti',    'tony.m@gmail.com',         '(204) 555-0107', '302 Corydon Ave, Fort Garry',        'Appliance removal, fridge had freon'],
  ['Stephanie Nguyen',  'steph.ng@gmail.com',       '(204) 555-0108', '5 Assiniboine Ave, Charleswood',     'Deck demolition, had concrete blocks'],
  ['Ray Deschamps',     'rdeschamps@shaw.ca',       '(204) 555-0109', '190 Salter St, North End',           'Commercial cleanout, multi-trip'],
  ['Linda Chow',        'linda.chow@gmail.com',     '(204) 555-0110', '44 Oakdale Blvd, Headingley',        'Moving out, lots of furniture'],
]

const custIds = customers.map(c => insertCustomer.run(...c).lastInsertRowid)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateOffset(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
function randBetween(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

// ─── Estimates ────────────────────────────────────────────────────────────────
const insertEst = db.prepare(`
  INSERT INTO estimates (customer_id, customer_name, status, load_pct, load_label, items,
    access_modifier, access_multiplier, dense_materials, hazmat_items,
    base_price, items_price, surcharges, estimated_dump_fee, total,
    estimated_labor, estimated_fuel, estimated_margin, notes, created_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`)

const estimates = [
  // converted
  { cid:0, status:'converted', load_pct:50, load_label:'1/2 Load', items:[{name:'Sofa/Couch',price:100,qty:1},{name:'Dresser',price:75,qty:2}], access:'stairs', mult:1.20, dense:[], haz:[], base:400, itemsP:250, surch:0, dump:85, total:798, notes:'Estate cleanout, very respectful family', daysAgo:-30 },
  { cid:1, status:'converted', load_pct:75, load_label:'3/4 Load', items:[{name:'Desk',price:70,qty:4},{name:'Bookshelf',price:50,qty:3}], access:'standard', mult:1.0, dense:[], haz:[], base:525, itemsP:430, surch:0, dump:120, total:955, notes:'Office reno, 2 loads', daysAgo:-22 },
  { cid:2, status:'converted', load_pct:25, load_label:'1/4 Load', items:[{name:'Fridge',price:100,qty:1},{name:'Sofa/Couch',price:100,qty:1}], access:'standard', mult:1.0, dense:[], haz:[{name:'Fridge (Freon removal)',price:25}], base:250, itemsP:200, surch:25, dump:85, total:475, notes:'Same-day, customer was very pleased', daysAgo:-18 },
  { cid:4, status:'converted', load_pct:100, load_label:'Full Load', items:[{name:'Dining Table',price:80,qty:1},{name:'Chair/Recliner',price:60,qty:3}], access:'long_carry', mult:1.15, dense:['Concrete','Shingles'], haz:[], base:700, itemsP:260, surch:135, dump:160, total:1258, notes:'Shed demo — concrete blocks, old shingles', daysAgo:-14 },
  { cid:5, status:'converted', load_pct:100, load_label:'Full Load', items:[{name:'Mattress (Queen)',price:70,qty:2},{name:'Dresser',price:75,qty:2},{name:'TV (40"+)',price:60,qty:1}], access:'stairs', mult:1.20, dense:[], haz:[], base:700, itemsP:350, surch:0, dump:95, total:1260, notes:'Full basement, took 3 hours', daysAgo:-10 },
  { cid:6, status:'converted', load_pct:12.5, load_label:'1/8 Load', items:[{name:'Fridge',price:100,qty:1},{name:'Washer',price:80,qty:1}], access:'standard', mult:1.0, dense:[], haz:['Fridge (Freon removal)'], base:150, itemsP:180, surch:25, dump:65, total:355, notes:'Just appliances', daysAgo:-7 },
  { cid:7, status:'converted', load_pct:75, load_label:'3/4 Load', items:[{name:'Deck (per section)',price:200,qty:3}], access:'long_carry', mult:1.15, dense:['Concrete'], haz:[], base:525, itemsP:600, surch:75, dump:140, total:1380, notes:'Deck demo + concrete planters', daysAgo:-5 },
  // approved/pending
  { cid:8, status:'approved', load_pct:100, load_label:'Full Load', items:[{name:'Desk',price:70,qty:6},{name:'Chair/Recliner',price:60,qty:8}], access:'elevator', mult:1.10, dense:[], haz:[], base:700, itemsP:900, surch:0, dump:130, total:1760, notes:'Multi-floor office, elevator access', daysAgo:-2 },
  { cid:9, status:'draft',    load_pct:50, load_label:'1/2 Load', items:[{name:'Sofa/Couch',price:100,qty:2},{name:'Mattress (King)',price:80,qty:1}], access:'stairs', mult:1.20, dense:[], haz:[], base:400, itemsP:280, surch:0, dump:85, total:816, notes:'Moving out, wants weekend booking', daysAgo:-1 },
  { cid:3, status:'sent',     load_pct:25, load_label:'1/4 Load', items:[{name:'Bookshelf',price:50,qty:2},{name:'Dining Chair',price:25,qty:4}], access:'standard', mult:1.0, dense:[], haz:[], base:250, itemsP:200, surch:0, dump:65, total:450, notes:'Property manager referral, tenant moveout', daysAgo:0 },
]

const estIds = estimates.map(e => {
  const labor = 35 * 2 * 2
  const margin = e.total - labor - 25 - e.dump
  const ago = new Date(); ago.setDate(ago.getDate() + e.daysAgo)
  return insertEst.run(
    custIds[e.cid], customers[e.cid][0], e.status,
    e.load_pct, e.load_label, JSON.stringify(e.items),
    e.access, e.mult, JSON.stringify(e.dense), JSON.stringify(e.haz),
    e.base, e.itemsP, e.surch, e.dump, e.total,
    labor, 25, margin, e.notes, ago.toISOString()
  ).lastInsertRowid
})

// ─── Jobs ─────────────────────────────────────────────────────────────────────
const insertJob = db.prepare(`
  INSERT INTO jobs (estimate_id, customer_id, customer_name, truck_id, crew, status,
    scheduled_date, scheduled_time, completed_at, actual_dump_fee, actual_load_pct,
    revenue, address, notes, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`)

const jobs = [
  // completed past jobs
  { ei:0, ci:0, truck:1, crew:[1,2,3], status:'completed', date:dateOffset(-30), time:'09:00', dump:90,  load:50,  rev:798,  addr:customers[0][3], ago:-30 },
  { ei:1, ci:1, truck:2, crew:[1,2],   status:'completed', date:dateOffset(-22), time:'10:00', dump:125, load:75,  rev:955,  addr:customers[1][3], ago:-22 },
  { ei:2, ci:2, truck:1, crew:[1,3],   status:'completed', date:dateOffset(-18), time:'13:00', dump:80,  load:25,  rev:475,  addr:customers[2][3], ago:-18 },
  { ei:3, ci:4, truck:1, crew:[1,2,3], status:'completed', date:dateOffset(-14), time:'08:00', dump:155, load:100, rev:1258, addr:customers[4][3], ago:-14 },
  { ei:4, ci:5, truck:2, crew:[1,2],   status:'completed', date:dateOffset(-10), time:'09:30', dump:100, load:100, rev:1260, addr:customers[5][3], ago:-10 },
  { ei:5, ci:6, truck:1, crew:[1,3],   status:'completed', date:dateOffset(-7),  time:'11:00', dump:60,  load:12.5,rev:355,  addr:customers[6][3], ago:-7  },
  { ei:6, ci:7, truck:2, crew:[1,2,3], status:'completed', date:dateOffset(-5),  time:'08:00', dump:145, load:75,  rev:1380, addr:customers[7][3], ago:-5  },
  // today / upcoming
  { ei:7, ci:8, truck:1, crew:[1,2],   status:'scheduled', date:dateOffset(0),   time:'09:00', dump:null,load:null,rev:1760, addr:customers[8][3], ago:0   },
  { ei:null, ci:3, truck:2, crew:[1,3],status:'scheduled', date:dateOffset(1),   time:'10:30', dump:null,load:null,rev:650,  addr:customers[3][3], ago:0   },
  { ei:null, ci:9, truck:1, crew:[1,2],status:'pending',   date:dateOffset(3),   time:'09:00', dump:null,load:null,rev:816,  addr:customers[9][3], ago:0   },
  { ei:null, ci:0, truck:null,crew:[],  status:'pending',   date:dateOffset(5),   time:'',      dump:null,load:null,rev:450,  addr:customers[0][3], ago:0   },
]

const jobIds = jobs.map(j => {
  const ago = new Date(); ago.setDate(ago.getDate() + j.ago)
  const completed = j.status === 'completed' ? ago.toISOString() : null
  return insertJob.run(
    estIds[j.ei] ?? null, custIds[j.ci], customers[j.ci][0],
    j.truck, JSON.stringify(j.crew), j.status,
    j.date, j.time, completed, j.dump, j.load,
    j.rev, j.addr, '', ago.toISOString(), ago.toISOString()
  ).lastInsertRowid
})

// ─── Invoices ─────────────────────────────────────────────────────────────────
const insertInv = db.prepare(`
  INSERT INTO invoices (job_id, estimate_id, customer_id, customer_name, amount, status, payment_method, paid_at, created_at)
  VALUES (?,?,?,?,?,?,?,?,?)
`)

const invoiceData = [
  { ji:0, ei:0, ci:0, amount:798,  status:'paid', method:'cash',       daysAgo:-30 },
  { ji:1, ei:1, ci:1, amount:955,  status:'paid', method:'e-transfer', daysAgo:-22 },
  { ji:2, ei:2, ci:2, amount:475,  status:'paid', method:'card',       daysAgo:-18 },
  { ji:3, ei:3, ci:4, amount:1258, status:'paid', method:'e-transfer', daysAgo:-14 },
  { ji:4, ei:4, ci:5, amount:1260, status:'paid', method:'cash',       daysAgo:-10 },
  { ji:5, ei:5, ci:6, amount:355,  status:'paid', method:'card',       daysAgo:-7  },
  { ji:6, ei:6, ci:7, amount:1380, status:'paid', method:'e-transfer', daysAgo:-5  },
  { ji:7, ei:7, ci:8, amount:1760, status:'unpaid', method:'',         daysAgo:0   },
  { ji:8, ei:null, ci:3, amount:650, status:'unpaid', method:'',       daysAgo:0   },
]

invoiceData.forEach(inv => {
  const ago = new Date(); ago.setDate(ago.getDate() + inv.daysAgo)
  const paid_at = inv.status === 'paid' ? ago.toISOString() : null
  insertInv.run(
    jobIds[inv.ji], estIds[inv.ei] ?? null, custIds[inv.ci],
    customers[inv.ci][0], inv.amount, inv.status, inv.method, paid_at, ago.toISOString()
  )
})

console.log(`✅ Seeded:
  ${customers.length} customers
  ${estimates.length} estimates
  ${jobs.length} jobs
  ${invoiceData.length} invoices`)

db.close()
