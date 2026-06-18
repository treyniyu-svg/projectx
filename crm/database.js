const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crm.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  service_type TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  address TEXT,
  notes TEXT,
  estimated_value REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  service_type TEXT,
  scheduled_date TEXT,
  scheduled_time TEXT,
  address TEXT,
  amount REAL DEFAULT 0,
  paid INTEGER DEFAULT 0,
  crew TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id),
  job_id INTEGER REFERENCES jobs(id),
  type TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare('SELECT COUNT(*) as c FROM leads').get();
if (count.c === 0) {
  const insertLead = db.prepare(`
    INSERT INTO leads (first_name, last_name, email, phone, service_type, status, source, address, notes, estimated_value, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertJob = db.prepare(`
    INSERT INTO jobs (lead_id, title, status, service_type, scheduled_date, scheduled_time, address, amount, paid, crew, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (lead_id, job_id, type, description, created_at) VALUES (?, ?, ?, ?, ?)
  `);

  const seedLeads = [
    ['James', 'Kowalski', 'james.kowalski@gmail.com', '204-555-0101', 'estate_cleanout', 'completed', 'referral', '142 Sherbrook St, Winnipeg, MB R3C 2B6', 'Full house estate cleanout, parents moved to care home. 3 bedrooms, basement included.', 1450, '2026-01-08 09:15:00', '2026-01-15 14:00:00'],
    ['Patricia', 'Friesen', 'pfriesen@shaw.ca', '204-555-0102', 'appliance_removal', 'completed', 'google', '87 Kenaston Blvd, Winnipeg, MB R3P 0X2', 'Old fridge, stove, washer and dryer from kitchen reno.', 320, '2026-01-22 11:00:00', '2026-01-28 10:00:00'],
    ['Tyler', 'Wiebe', 'twiebe@hotmail.com', '204-555-0103', 'construction_debris', 'completed', 'website', '554 Notre Dame Ave, Winnipeg, MB R3B 1S4', 'Basement renovation debris - drywall, flooring, lumber scraps.', 580, '2026-02-05 08:30:00', '2026-02-12 09:00:00'],
    ['Sandra', 'Dueck', 'sdueck@gmail.com', '204-555-0104', 'furniture_removal', 'completed', 'facebook', '33 Corydon Ave, Winnipeg, MB R3L 0H4', 'Old sectional sofa, dining set, 2 dressers after home staging.', 390, '2026-02-18 13:00:00', '2026-02-24 11:00:00'],
    ['Gordon', 'Reimer', 'greimer@gmail.com', '204-555-0105', 'yard_waste', 'completed', 'kijiji', '209 Inkster Blvd, Winnipeg, MB R2X 1N1', 'Large backyard cleanout - branches, old fence posts, garden waste.', 260, '2026-03-03 10:00:00', '2026-03-09 08:00:00'],
    ['Michelle', 'Hiebert', 'mhiebert@outlook.com', '204-555-0106', 'hoarding_cleanup', 'completed', 'phone', '76 Fermor Ave, Winnipeg, MB R3T 0Y8', 'Hoarding situation - entire house. Required 3 truckloads.', 1900, '2026-03-15 07:00:00', '2026-03-20 17:00:00'],
    ['Kevin', 'Loewen', 'kloewen@gmail.com', '204-555-0107', 'general_junk', 'quoted', 'google', '411 McPhillips St, Winnipeg, MB R2X 2H5', 'Mixed junk from garage and shed. About half a truckload.', 310, '2026-04-02 09:00:00', '2026-04-05 10:30:00'],
    ['Brenda', 'Klassen', 'bklassen@shaw.ca', '204-555-0108', 'estate_cleanout', 'booked', 'referral', '19 Grant Ave, Winnipeg, MB R3M 1Y7', 'Aunt passed away. 2 bedroom bungalow full cleanout needed.', 1100, '2026-04-10 14:00:00', '2026-04-12 09:00:00'],
    ['Ryan', 'Martens', 'rmartens@gmail.com', '204-555-0109', 'appliance_removal', 'contacted', 'website', '663 Pembina Hwy, Winnipeg, MB R3M 2L5', 'Old appliances after kitchen renovation. 4 items total.', 295, '2026-04-20 11:30:00', '2026-04-22 08:00:00'],
    ['Donna', 'Neufeld', 'dneufeld@hotmail.com', '204-555-0110', 'construction_debris', 'new', 'google', '128 Henderson Hwy, Winnipeg, MB R2L 1L6', 'Bathroom reno leftovers - tiles, old tub, vanity.', 450, '2026-05-03 09:45:00', '2026-05-03 09:45:00'],
    ['Craig', 'Penner', 'cpenner@gmail.com', '204-555-0111', 'furniture_removal', 'quoted', 'facebook', '345 Portage Ave, Winnipeg, MB R3B 2C3', 'Office furniture removal after company downsized. 10+ desks.', 680, '2026-05-11 10:00:00', '2026-05-14 11:00:00'],
    ['Heather', 'Toews', 'htoews@shaw.ca', '204-555-0112', 'general_junk', 'booked', 'kijiji', '52 River Rd, Winnipeg, MB R2M 3Y6', 'General household junk purge. Moving to smaller place.', 380, '2026-05-22 08:00:00', '2026-05-25 09:00:00'],
    ['Aaron', 'Giesbrecht', 'agiesbrecht@gmail.com', '204-555-0113', 'yard_waste', 'contacted', 'phone', '781 Lagimodiere Blvd, Winnipeg, MB R2J 0T8', 'Spring yard cleanup - leaves, dead shrubs, old shed contents.', 220, '2026-06-01 13:00:00', '2026-06-03 10:00:00'],
    ['Lori', 'Schellenberg', 'lschellenberg@outlook.com', '204-555-0114', 'appliance_removal', 'new', 'website', '234 St. Anne\'s Rd, Winnipeg, MB R2M 3A2', 'Old chest freezer and mini fridge from garage.', 175, '2026-06-08 09:30:00', '2026-06-08 09:30:00'],
    ['Frank', 'Bergen', 'fbergen@gmail.com', '204-555-0115', 'hoarding_cleanup', 'quoted', 'referral', '96 Roblin Blvd, Winnipeg, MB R3R 0C9', 'Hoarding cleanup for investment property. 2 bedrooms, kitchen.', 1350, '2026-06-12 11:00:00', '2026-06-14 10:00:00']
  ];

  const leadIds = [];
  seedLeads.forEach(lead => {
    const r = insertLead.run(...lead);
    leadIds.push(r.lastInsertRowid);
  });

  // 10 jobs linked to leads 1-10
  const seedJobs = [
    [leadIds[0], 'Kowalski Estate Cleanout', 'completed', 'estate_cleanout', '2026-01-14', '08:00', '142 Sherbrook St, Winnipeg, MB R3C 2B6', 1450, 1, 'Team B', 'Took 2 full loads. Customer very happy.', '2026-01-08 09:15:00', '2026-01-14 17:00:00'],
    [leadIds[1], 'Friesen Appliance Pickup', 'completed', 'appliance_removal', '2026-01-27', '10:00', '87 Kenaston Blvd, Winnipeg, MB R3P 0X2', 320, 1, 'Team A', 'Fridge, stove, washer, dryer. Paid cash.', '2026-01-22 11:00:00', '2026-01-27 12:00:00'],
    [leadIds[2], 'Wiebe Construction Debris', 'completed', 'construction_debris', '2026-02-11', '09:00', '554 Notre Dame Ave, Winnipeg, MB R3B 1S4', 580, 1, 'Team C', 'Heavy drywall. Paid by e-transfer.', '2026-02-05 08:30:00', '2026-02-11 13:00:00'],
    [leadIds[3], 'Dueck Furniture Removal', 'completed', 'furniture_removal', '2026-02-23', '11:00', '33 Corydon Ave, Winnipeg, MB R3L 0H4', 390, 1, 'Team A', 'Staging prep. Completed in 2 hours.', '2026-02-18 13:00:00', '2026-02-23 13:00:00'],
    [leadIds[4], 'Reimer Yard Waste', 'completed', 'yard_waste', '2026-03-08', '08:00', '209 Inkster Blvd, Winnipeg, MB R2X 1N1', 260, 1, 'Team B', 'Early spring cleanup done.', '2026-03-03 10:00:00', '2026-03-08 11:00:00'],
    [leadIds[5], 'Hiebert Hoarding Cleanup', 'completed', 'hoarding_cleanup', '2026-03-17', '07:00', '76 Fermor Ave, Winnipeg, MB R3T 0Y8', 1900, 1, 'Team B', '3 truckloads. 2-day job. Full payment received.', '2026-03-15 07:00:00', '2026-03-18 17:00:00'],
    [leadIds[7], 'Klassen Estate Cleanout', 'booked', 'estate_cleanout', '2026-06-25', '08:00', '19 Grant Ave, Winnipeg, MB R3M 1Y7', 1100, 0, 'Team B', 'Deposit received. Full crew scheduled.', '2026-04-10 14:00:00', '2026-04-12 09:00:00'],
    [leadIds[10], 'Penner Office Furniture', 'booked', 'furniture_removal', '2026-06-20', '09:00', '345 Portage Ave, Winnipeg, MB R3B 2C3', 680, 0, 'Team C', 'Large job. Elevator access confirmed.', '2026-05-11 10:00:00', '2026-05-14 11:00:00'],
    [leadIds[11], 'Toews Household Junk', 'booked', 'general_junk', '2026-06-19', '08:00', '52 River Rd, Winnipeg, MB R2M 3Y6', 380, 0, 'Team A', 'Moving day haul. Confirmed for morning.', '2026-05-22 08:00:00', '2026-05-25 09:00:00'],
    [leadIds[14], 'Bergen Hoarding Cleanup', 'quoted', 'hoarding_cleanup', '2026-06-28', '09:00', '96 Roblin Blvd, Winnipeg, MB R3R 0C9', 1350, 0, '', 'Quote sent. Awaiting owner approval.', '2026-06-12 11:00:00', '2026-06-14 10:00:00']
  ];

  seedJobs.forEach(job => {
    insertJob.run(...job);
  });

  // Activities
  insertActivity.run(leadIds[0], null, 'call', 'Initial call received. Customer confirmed all rooms need clearing.', '2026-01-08 09:20:00');
  insertActivity.run(leadIds[0], null, 'note', 'Scheduled site visit for Jan 10.', '2026-01-09 10:00:00');
  insertActivity.run(leadIds[0], null, 'status_change', 'Status updated to completed.', '2026-01-14 17:00:00');
  insertActivity.run(leadIds[1], null, 'call', 'Customer called to book pickup.', '2026-01-22 11:05:00');
  insertActivity.run(leadIds[1], null, 'status_change', 'Status updated to completed.', '2026-01-27 12:30:00');
  insertActivity.run(leadIds[5], null, 'note', 'Sensitive situation. Be respectful and professional.', '2026-03-15 07:05:00');
  insertActivity.run(leadIds[5], null, 'call', 'Called to confirm crew size and start time.', '2026-03-16 08:00:00');
  insertActivity.run(leadIds[7], null, 'email', 'Quote emailed. Deposit invoice sent.', '2026-04-11 09:00:00');
  insertActivity.run(leadIds[7], null, 'note', 'Deposit of $300 received via e-transfer.', '2026-04-13 10:00:00');
  insertActivity.run(leadIds[11], null, 'call', 'Confirmed moving date and time window.', '2026-05-23 09:00:00');
}

module.exports = db;
