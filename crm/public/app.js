// ─── Storage ──────────────────────────────────────────────────────────────────

function getLeads() { return JSON.parse(localStorage.getItem('crm_leads') || '[]'); }
function getJobs() { return JSON.parse(localStorage.getItem('crm_jobs') || '[]'); }
function getActivities() { return JSON.parse(localStorage.getItem('crm_activities') || '[]'); }
function saveLeads(d) { localStorage.setItem('crm_leads', JSON.stringify(d)); }
function saveJobs(d) { localStorage.setItem('crm_jobs', JSON.stringify(d)); }
function saveActivities(d) { localStorage.setItem('crm_activities', JSON.stringify(d)); }
function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  if (getLeads().length) return;

  const leads = [
    { id:1, first_name:'James', last_name:'Kowalski', email:'james.kowalski@gmail.com', phone:'204-555-0101', service_type:'Estate Cleanout', status:'completed', source:'Referral', address:'142 Sherbrook St, Winnipeg', notes:'Full house estate cleanout', estimated_value:1450, created_at:'2026-01-08T09:15:00' },
    { id:2, first_name:'Patricia', last_name:'Friesen', email:'pfriesen@shaw.ca', phone:'204-555-0102', service_type:'Appliance Removal', status:'completed', source:'Google', address:'87 Kenaston Blvd, Winnipeg', notes:'Fridge, stove, washer, dryer', estimated_value:320, created_at:'2026-01-22T11:00:00' },
    { id:3, first_name:'Tyler', last_name:'Wiebe', email:'twiebe@hotmail.com', phone:'204-555-0103', service_type:'Residential Junk Removal', status:'completed', source:'Website', address:'554 Notre Dame Ave, Winnipeg', notes:'Basement reno debris', estimated_value:580, created_at:'2026-02-05T08:30:00' },
    { id:4, first_name:'Sandra', last_name:'Dueck', email:'sdueck@gmail.com', phone:'204-555-0104', service_type:'Residential Junk Removal', status:'completed', source:'Facebook', address:'33 Corydon Ave, Winnipeg', notes:'Old furniture after staging', estimated_value:390, created_at:'2026-02-18T13:00:00' },
    { id:5, first_name:'Gordon', last_name:'Reimer', email:'greimer@gmail.com', phone:'204-555-0105', service_type:'Residential Junk Removal', status:'completed', source:'Kijiji', address:'209 Inkster Blvd, Winnipeg', notes:'Backyard cleanout', estimated_value:260, created_at:'2026-03-03T10:00:00' },
    { id:6, first_name:'Michelle', last_name:'Hiebert', email:'mhiebert@outlook.com', phone:'204-555-0106', service_type:'Estate Cleanout', status:'completed', source:'Phone', address:'76 Fermor Ave, Winnipeg', notes:'Hoarding situation, 3 loads', estimated_value:1900, created_at:'2026-03-15T07:00:00' },
    { id:7, first_name:'Kevin', last_name:'Loewen', email:'kloewen@gmail.com', phone:'204-555-0107', service_type:'Residential Junk Removal', status:'quoted', source:'Google', address:'411 McPhillips St, Winnipeg', notes:'Half truckload from garage', estimated_value:310, created_at:'2026-04-02T09:00:00' },
    { id:8, first_name:'Brenda', last_name:'Klassen', email:'bklassen@shaw.ca', phone:'204-555-0108', service_type:'Estate Cleanout', status:'booked', source:'Referral', address:'19 Grant Ave, Winnipeg', notes:'2 bedroom bungalow cleanout', estimated_value:1100, created_at:'2026-04-10T14:00:00' },
    { id:9, first_name:'Ryan', last_name:'Martens', email:'rmartens@gmail.com', phone:'204-555-0109', service_type:'Appliance Removal', status:'contacted', source:'Website', address:'663 Pembina Hwy, Winnipeg', notes:'4 appliances after kitchen reno', estimated_value:295, created_at:'2026-04-20T11:30:00' },
    { id:10, first_name:'Donna', last_name:'Neufeld', email:'dneufeld@hotmail.com', phone:'204-555-0110', service_type:'Residential Junk Removal', status:'new', source:'Google', address:'128 Henderson Hwy, Winnipeg', notes:'Bathroom reno leftovers', estimated_value:450, created_at:'2026-05-03T09:45:00' },
    { id:11, first_name:'Craig', last_name:'Penner', email:'cpenner@gmail.com', phone:'204-555-0111', service_type:'Commercial Junk Removal', status:'quoted', source:'Facebook', address:'345 Portage Ave, Winnipeg', notes:'Office furniture, 10+ desks', estimated_value:680, created_at:'2026-05-11T10:00:00' },
    { id:12, first_name:'Heather', last_name:'Toews', email:'htoews@shaw.ca', phone:'204-555-0112', service_type:'Residential Junk Removal', status:'booked', source:'Kijiji', address:'52 River Rd, Winnipeg', notes:'General household purge', estimated_value:380, created_at:'2026-05-22T08:00:00' },
    { id:13, first_name:'Aaron', last_name:'Giesbrecht', email:'agiesbrecht@gmail.com', phone:'204-555-0113', service_type:'Residential Junk Removal', status:'contacted', source:'Phone', address:'781 Lagimodiere Blvd, Winnipeg', notes:'Spring yard cleanup', estimated_value:220, created_at:'2026-06-01T13:00:00' },
    { id:14, first_name:'Lori', last_name:'Schellenberg', email:'lschellenberg@outlook.com', phone:'204-555-0114', service_type:'Appliance Removal', status:'new', source:'Website', address:'234 St. Annes Rd, Winnipeg', notes:'Chest freezer and mini fridge', estimated_value:175, created_at:'2026-06-08T09:30:00' },
    { id:15, first_name:'Frank', last_name:'Bergen', email:'fbergen@gmail.com', phone:'204-555-0115', service_type:'Estate Cleanout', status:'quoted', source:'Referral', address:'96 Roblin Blvd, Winnipeg', notes:'Investment property hoarding cleanup', estimated_value:1350, created_at:'2026-06-12T11:00:00' },
  ];

  const jobs = [
    { id:1, lead_id:1, title:'Kowalski Estate Cleanout', status:'completed', service_type:'Estate Cleanout', scheduled_date:'2026-01-14', scheduled_time:'08:00', address:'142 Sherbrook St, Winnipeg', amount:1450, paid:true, crew:'Team B', notes:'2 full loads. Customer very happy.' },
    { id:2, lead_id:2, title:'Friesen Appliance Pickup', status:'completed', service_type:'Appliance Removal', scheduled_date:'2026-01-27', scheduled_time:'10:00', address:'87 Kenaston Blvd, Winnipeg', amount:320, paid:true, crew:'Team A', notes:'Paid cash.' },
    { id:3, lead_id:3, title:'Wiebe Reno Debris', status:'completed', service_type:'Residential Junk Removal', scheduled_date:'2026-02-11', scheduled_time:'09:00', address:'554 Notre Dame Ave, Winnipeg', amount:580, paid:true, crew:'Team C', notes:'Heavy drywall. Paid e-transfer.' },
    { id:4, lead_id:4, title:'Dueck Furniture Removal', status:'completed', service_type:'Residential Junk Removal', scheduled_date:'2026-02-23', scheduled_time:'11:00', address:'33 Corydon Ave, Winnipeg', amount:390, paid:true, crew:'Team A', notes:'Completed in 2 hours.' },
    { id:5, lead_id:5, title:'Reimer Yard Waste', status:'completed', service_type:'Residential Junk Removal', scheduled_date:'2026-03-08', scheduled_time:'08:00', address:'209 Inkster Blvd, Winnipeg', amount:260, paid:true, crew:'Team B', notes:'Early spring cleanup.' },
    { id:6, lead_id:6, title:'Hiebert Hoarding Cleanup', status:'completed', service_type:'Estate Cleanout', scheduled_date:'2026-03-17', scheduled_time:'07:00', address:'76 Fermor Ave, Winnipeg', amount:1900, paid:true, crew:'Team B', notes:'3 truckloads. 2-day job.' },
    { id:7, lead_id:8, title:'Klassen Estate Cleanout', status:'booked', service_type:'Estate Cleanout', scheduled_date:'2026-06-25', scheduled_time:'08:00', address:'19 Grant Ave, Winnipeg', amount:1100, paid:false, crew:'Team B', notes:'Deposit received.' },
    { id:8, lead_id:9, title:'Martens Appliance Removal', status:'quoted', service_type:'Appliance Removal', scheduled_date:'2026-06-28', scheduled_time:'10:00', address:'663 Pembina Hwy, Winnipeg', amount:295, paid:false, crew:'', notes:'Awaiting confirmation.' },
    { id:9, lead_id:11, title:'Penner Office Furniture', status:'quoted', service_type:'Commercial Junk Removal', scheduled_date:'2026-07-02', scheduled_time:'08:00', address:'345 Portage Ave, Winnipeg', amount:680, paid:false, crew:'Team C', notes:'Need large truck.' },
    { id:10, lead_id:12, title:'Toews Household Junk', status:'booked', service_type:'Residential Junk Removal', scheduled_date:'2026-06-30', scheduled_time:'09:00', address:'52 River Rd, Winnipeg', amount:380, paid:false, crew:'Team A', notes:'' },
  ];

  const activities = [
    { id:1, lead_id:1, job_id:null, type:'note', description:'Customer called to confirm availability', created_at:'2026-01-08T09:05:00' },
    { id:2, lead_id:1, job_id:null, type:'status_change', description:'Status changed to completed', created_at:'2026-01-14T17:00:00' },
    { id:3, lead_id:2, job_id:null, type:'email', description:'Quote sent via email', created_at:'2026-01-22T11:30:00' },
    { id:4, lead_id:6, job_id:null, type:'note', description:'Large hoarding job - confirmed need for 3 trucks', created_at:'2026-03-15T08:00:00' },
  ];

  saveLeads(leads);
  saveJobs(jobs);
  saveActivities(activities);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

let currentTab = 'dashboard';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let draggedJobId = null;

function statusBadge(status) {
  if (!status) return '';
  return `<span class="badge badge-${status}">${status.replace(/_/g, ' ')}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(v) {
  return '$' + parseFloat(v || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatServiceType(type) {
  if (!type) return '-';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (navItem) navItem.classList.add('active');
  const tabEl = document.getElementById(`tab-${tabName}`);
  if (tabEl) tabEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', leads: 'Leads', pipeline: 'Pipeline', calendar: 'Calendar' };
  document.getElementById('page-title').textContent = titles[tabName] || tabName;
  currentTab = tabName;
  if (tabName === 'dashboard') loadDashboard();
  else if (tabName === 'leads') loadLeads();
  else if (tabName === 'pipeline') loadPipeline();
  else if (tabName === 'calendar') renderCalendar();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => { e.preventDefault(); switchTab(item.dataset.tab); });
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function loadDashboard() {
  const leads = getLeads();
  const jobs = getJobs();

  const totalLeads = leads.length;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthlyRevenue = jobs
    .filter(j => j.status === 'completed' && j.paid && (j.scheduled_date || '').startsWith(thisMonth))
    .reduce((s, j) => s + parseFloat(j.amount || 0), 0);
  const jobsBooked = jobs.filter(j => ['booked','in_progress','completed'].includes(j.status)).length;
  const converted = leads.filter(l => ['booked','completed'].includes(l.status)).length;
  const conversionRate = totalLeads ? ((converted / totalLeads) * 100).toFixed(1) : 0;

  document.getElementById('stat-total-leads').textContent = totalLeads;
  document.getElementById('stat-monthly-revenue').textContent = formatCurrency(monthlyRevenue);
  document.getElementById('stat-jobs-booked').textContent = jobsBooked;
  document.getElementById('stat-conversion-rate').textContent = conversionRate + '%';

  // Monthly trend (last 6 months)
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const count = leads.filter(l => (l.created_at || '').startsWith(key)).length;
    trend.push({ month: key, count });
  }
  drawBarChart(trend);

  // Jobs by status
  const statusCounts = {};
  jobs.forEach(j => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });
  drawDonutChart(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));

  // Recent leads
  const recent = [...leads].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5);
  document.getElementById('recent-leads-tbody').innerHTML = recent.map(l => `
    <tr style="cursor:pointer" onclick="openLeadPanel(${l.id})">
      <td>${l.first_name} ${l.last_name}</td>
      <td>${l.phone || '-'}</td>
      <td>${formatServiceType(l.service_type)}</td>
      <td>${statusBadge(l.status)}</td>
      <td>${formatCurrency(l.estimated_value)}</td>
    </tr>
  `).join('');
}

function drawBarChart(trend) {
  const canvas = document.getElementById('bar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 40, padR = 20, padT = 20, padB = 50;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxCount = Math.max(...trend.map(t => t.count), 1);

  for (let i = 0; i <= 5; i++) {
    const y = padT + chartH - (i / 5) * chartH;
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round((i/5)*maxCount), padL - 6, y + 4);
  }

  const barWidth = Math.min(chartW / trend.length - 8, 48);
  const gap = (chartW - barWidth * trend.length) / (trend.length + 1);

  trend.forEach((item, i) => {
    const barH = (item.count / maxCount) * chartH;
    const x = padL + gap + i * (barWidth + gap);
    const y = padT + chartH - barH;
    const r = Math.min(4, barH / 2);

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    if (item.count > 0) {
      ctx.fillStyle = '#1e293b'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(item.count, x + barWidth / 2, y - 4);
    }

    const [yr, mo] = item.month.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    ctx.fillStyle = '#64748b'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((months[parseInt(mo)-1] || mo) + ' ' + yr.slice(2), x + barWidth/2, padT + chartH + 18);
  });
}

function drawDonutChart(statusData) {
  const canvas = document.getElementById('donut-chart');
  const legendEl = document.getElementById('donut-legend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const colors = ['#3b82f6','#f59e0b','#22c55e','#6366f1','#ef4444','#14b8a6','#f97316'];
  const total = statusData.reduce((s, d) => s + d.count, 0);
  if (!total) { if (legendEl) legendEl.innerHTML = ''; return; }

  const cx = W/2, cy = H/2, outerR = 90, innerR = 52;
  let startAngle = -Math.PI/2;

  statusData.forEach((item, i) => {
    const slice = (item.count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 22px Inter,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 8);
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px Inter,sans-serif';
  ctx.fillText('total jobs', cx, cy + 24);

  if (legendEl) {
    legendEl.innerHTML = statusData.map((item, i) => `
      <div class="donut-legend-item">
        <div class="donut-legend-color" style="background:${colors[i % colors.length]}"></div>
        <span>${item.status.replace(/_/g,' ')} (${item.count})</span>
      </div>
    `).join('');
  }
}

// ─── Leads ─────────────────────────────────────────────────────────────────────

function loadLeads() {
  let data = getLeads();
  const search = document.getElementById('leads-search').value.toLowerCase();
  const status = document.getElementById('leads-status-filter').value;

  if (search) data = data.filter(l =>
    `${l.first_name} ${l.last_name} ${l.phone} ${l.email}`.toLowerCase().includes(search)
  );
  if (status) data = data.filter(l => l.status === status);
  data = [...data].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  document.getElementById('leads-tbody').innerHTML = data.map(l => `
    <tr>
      <td style="cursor:pointer" onclick="openLeadPanel(${l.id})">${l.first_name} ${l.last_name}</td>
      <td>${l.phone || '-'}</td>
      <td>${l.email || '-'}</td>
      <td>${formatServiceType(l.service_type)}</td>
      <td>${statusBadge(l.status)}</td>
      <td>${formatCurrency(l.estimated_value)}</td>
      <td>${formatDate(l.created_at)}</td>
      <td>
        <button class="btn-icon" onclick="openEditLead(${l.id})" title="Edit"><i class="fas fa-pen"></i></button>
        <button class="btn-icon" onclick="deleteLead(${l.id})" title="Delete" style="color:#ef4444"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:32px">No leads found</td></tr>';
}

document.getElementById('leads-search').addEventListener('input', loadLeads);
document.getElementById('leads-status-filter').addEventListener('change', loadLeads);

// ─── Lead Panel ───────────────────────────────────────────────────────────────

function openLeadPanel(id) {
  const lead = getLeads().find(l => l.id === id);
  if (!lead) return;
  const activities = getActivities().filter(a => a.lead_id === id).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  const jobs = getJobs().filter(j => j.lead_id === id);

  const typeIcon = { note:'fa-note-sticky', call:'fa-phone', email:'fa-envelope', status_change:'fa-arrow-right-arrow-left' };

  document.getElementById('lead-panel-name').textContent = `${lead.first_name} ${lead.last_name}`;
  document.getElementById('lead-panel-body').innerHTML = `
    <div class="panel-section">
      <div class="detail-row"><span class="detail-label">Status</span><span>${statusBadge(lead.status)}</span></div>
      <div class="detail-row"><span class="detail-label">Phone</span><span>${lead.phone || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span>${lead.email || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span>${formatServiceType(lead.service_type)}</span></div>
      <div class="detail-row"><span class="detail-label">Value</span><span>${formatCurrency(lead.estimated_value)}</span></div>
      <div class="detail-row"><span class="detail-label">Source</span><span>${lead.source || '-'}</span></div>
      <div class="detail-row"><span class="detail-label">Address</span><span>${lead.address || '-'}</span></div>
      ${lead.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span>${lead.notes}</span></div>` : ''}
      <button class="btn btn-primary" style="margin-top:12px;font-size:13px;padding:7px 14px" onclick="openEditLead(${lead.id})"><i class="fas fa-pen"></i> Edit</button>
    </div>
    ${jobs.length ? `
    <div class="panel-section">
      <div class="panel-section-title">Jobs (${jobs.length})</div>
      ${jobs.map(j => `<div class="panel-job-item"><span>${j.title}</span>${statusBadge(j.status)}</div>`).join('')}
    </div>` : ''}
    <div class="panel-section">
      <div class="panel-section-title">Activity</div>
      ${activities.length ? activities.map(a => `
        <div class="timeline-item">
          <div class="timeline-dot"><i class="fas ${typeIcon[a.type] || 'fa-circle-dot'}"></i></div>
          <div>
            <div style="font-size:13px;color:#334155">${a.description}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px">${formatDate(a.created_at)}</div>
          </div>
        </div>
      `).join('') : '<p style="font-size:13px;color:#94a3b8">No activity yet.</p>'}
      <div style="display:flex;gap:8px;margin-top:12px">
        <input type="text" id="note-input" placeholder="Add a note…" style="flex:1;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;font-family:inherit">
        <button class="btn btn-primary" style="font-size:13px;padding:7px 14px" onclick="addNote(${lead.id})">Add</button>
      </div>
    </div>
  `;

  document.getElementById('lead-panel').classList.add('open');
  document.getElementById('panel-overlay').classList.add('show');
}

function addNote(leadId) {
  const input = document.getElementById('note-input');
  const text = input.value.trim();
  if (!text) return;
  const activities = getActivities();
  activities.push({ id: nextId(activities), lead_id: leadId, job_id: null, type: 'note', description: text, created_at: new Date().toISOString() });
  saveActivities(activities);
  openLeadPanel(leadId);
}

function closePanel() {
  document.getElementById('lead-panel').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('show');
}
document.getElementById('panel-close').addEventListener('click', closePanel);
document.getElementById('panel-overlay').addEventListener('click', closePanel);

// ─── Lead Modal ───────────────────────────────────────────────────────────────

let editingLeadId = null;

function openAddLead() {
  editingLeadId = null;
  document.getElementById('lead-modal-title').textContent = 'Add Lead';
  document.getElementById('lead-form').reset();
  document.getElementById('lead-id').value = '';
  document.getElementById('lead-modal-overlay').classList.add('open');
}

function openEditLead(id) {
  const lead = getLeads().find(l => l.id === id);
  if (!lead) return;
  editingLeadId = id;
  document.getElementById('lead-modal-title').textContent = 'Edit Lead';
  document.getElementById('lead-id').value = lead.id;
  document.getElementById('lead-first-name').value = lead.first_name || '';
  document.getElementById('lead-last-name').value = lead.last_name || '';
  document.getElementById('lead-phone').value = lead.phone || '';
  document.getElementById('lead-email').value = lead.email || '';
  document.getElementById('lead-address').value = lead.address || '';
  document.getElementById('lead-service').value = lead.service_type || '';
  document.getElementById('lead-status').value = lead.status || 'new';
  document.getElementById('lead-source').value = lead.source || '';
  document.getElementById('lead-value').value = lead.estimated_value || '';
  document.getElementById('lead-notes').value = lead.notes || '';
  document.getElementById('lead-modal-overlay').classList.add('open');
}

document.getElementById('add-lead-btn').addEventListener('click', openAddLead);
document.getElementById('lead-modal-close').addEventListener('click', () => document.getElementById('lead-modal-overlay').classList.remove('open'));
document.getElementById('lead-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

document.getElementById('lead-form').addEventListener('submit', e => {
  e.preventDefault();
  const leads = getLeads();
  const body = {
    first_name: document.getElementById('lead-first-name').value.trim(),
    last_name: document.getElementById('lead-last-name').value.trim(),
    phone: document.getElementById('lead-phone').value.trim(),
    email: document.getElementById('lead-email').value.trim(),
    address: document.getElementById('lead-address').value.trim(),
    service_type: document.getElementById('lead-service').value,
    status: document.getElementById('lead-status').value,
    source: document.getElementById('lead-source').value,
    estimated_value: parseFloat(document.getElementById('lead-value').value) || 0,
    notes: document.getElementById('lead-notes').value.trim(),
  };

  if (editingLeadId) {
    const idx = leads.findIndex(l => l.id === editingLeadId);
    if (idx !== -1) leads[idx] = { ...leads[idx], ...body };
  } else {
    leads.push({ id: nextId(leads), ...body, created_at: new Date().toISOString() });
  }

  saveLeads(leads);
  document.getElementById('lead-modal-overlay').classList.remove('open');
  if (currentTab === 'leads') loadLeads();
  if (currentTab === 'dashboard') loadDashboard();
});

function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  saveLeads(getLeads().filter(l => l.id !== id));
  saveJobs(getJobs().filter(j => j.lead_id !== id));
  saveActivities(getActivities().filter(a => a.lead_id !== id));
  loadLeads();
}

// ─── Pipeline (Kanban) ────────────────────────────────────────────────────────

function loadPipeline() {
  const jobs = getJobs();
  const leads = getLeads();
  const statuses = ['new','quoted','booked','in_progress','completed'];

  statuses.forEach(status => {
    const col = document.getElementById(`col-${status}`);
    const cnt = document.getElementById(`col-count-${status}`);
    const colJobs = jobs.filter(j => j.status === status);
    cnt.textContent = colJobs.length;
    col.innerHTML = colJobs.map(j => {
      const lead = leads.find(l => l.id === j.lead_id);
      return `
        <div class="kanban-card" draggable="true" data-id="${j.id}" onclick="openJobDetail(${j.id})">
          <div class="kanban-card-title">${j.title}</div>
          ${lead ? `<div class="kanban-card-meta"><i class="fas fa-user"></i> ${lead.first_name} ${lead.last_name}</div>` : ''}
          ${j.service_type ? `<div class="kanban-card-meta"><i class="fas fa-wrench"></i> ${formatServiceType(j.service_type)}</div>` : ''}
          ${j.scheduled_date ? `<div class="kanban-card-meta"><i class="fas fa-calendar"></i> ${formatDate(j.scheduled_date)}</div>` : ''}
          <div class="kanban-card-amount">${formatCurrency(j.amount)}</div>
        </div>
      `;
    }).join('');
  });

  initDragDrop();
}

function initDragDrop() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      draggedJobId = parseInt(card.dataset.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (!draggedJobId) return;
      const newStatus = col.dataset.status;
      const jobs = getJobs();
      const idx = jobs.findIndex(j => j.id === draggedJobId);
      if (idx !== -1) jobs[idx].status = newStatus;
      saveJobs(jobs);
      loadPipeline();
    });
  });
}

// ─── Job Modal ────────────────────────────────────────────────────────────────

let editingJobId = null;
let viewingJobId = null;

function populateLeadDropdown(selectedId) {
  const leads = getLeads().sort((a,b) => a.first_name.localeCompare(b.first_name));
  document.getElementById('job-lead').innerHTML =
    '<option value="">No lead</option>' +
    leads.map(l => `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${l.first_name} ${l.last_name}</option>`).join('');
}

function openAddJob() {
  editingJobId = null;
  document.getElementById('job-modal-title').textContent = 'Add Job';
  document.getElementById('job-form').reset();
  document.getElementById('job-id').value = '';
  populateLeadDropdown(null);
  document.getElementById('job-modal-overlay').classList.add('open');
}

function openEditJob(id) {
  const job = getJobs().find(j => j.id === id);
  if (!job) return;
  editingJobId = id;
  document.getElementById('job-modal-title').textContent = 'Edit Job';
  document.getElementById('job-id').value = job.id;
  document.getElementById('job-title').value = job.title || '';
  document.getElementById('job-status').value = job.status || 'new';
  document.getElementById('job-service').value = job.service_type || '';
  document.getElementById('job-date').value = job.scheduled_date || '';
  document.getElementById('job-time').value = job.scheduled_time || '';
  document.getElementById('job-amount').value = job.amount || '';
  document.getElementById('job-paid').value = job.paid ? '1' : '0';
  document.getElementById('job-crew').value = job.crew || '';
  document.getElementById('job-address').value = job.address || '';
  document.getElementById('job-notes').value = job.notes || '';
  populateLeadDropdown(job.lead_id);
  document.getElementById('job-modal-overlay').classList.add('open');
  document.getElementById('job-detail-overlay').classList.remove('open');
}

document.getElementById('add-job-btn').addEventListener('click', openAddJob);
document.getElementById('job-modal-close').addEventListener('click', () => document.getElementById('job-modal-overlay').classList.remove('open'));
document.getElementById('job-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

document.getElementById('job-form').addEventListener('submit', e => {
  e.preventDefault();
  const jobs = getJobs();
  const body = {
    lead_id: parseInt(document.getElementById('job-lead').value) || null,
    title: document.getElementById('job-title').value.trim(),
    status: document.getElementById('job-status').value,
    service_type: document.getElementById('job-service').value,
    scheduled_date: document.getElementById('job-date').value,
    scheduled_time: document.getElementById('job-time').value,
    amount: parseFloat(document.getElementById('job-amount').value) || 0,
    paid: document.getElementById('job-paid').value === '1',
    crew: document.getElementById('job-crew').value.trim(),
    address: document.getElementById('job-address').value.trim(),
    notes: document.getElementById('job-notes').value.trim(),
  };

  if (editingJobId) {
    const idx = jobs.findIndex(j => j.id === editingJobId);
    if (idx !== -1) jobs[idx] = { ...jobs[idx], ...body };
  } else {
    jobs.push({ id: nextId(jobs), ...body, created_at: new Date().toISOString() });
  }

  saveJobs(jobs);
  document.getElementById('job-modal-overlay').classList.remove('open');
  if (currentTab === 'pipeline') loadPipeline();
  if (currentTab === 'calendar') renderCalendar();
  if (currentTab === 'dashboard') loadDashboard();
});

// ─── Job Detail ───────────────────────────────────────────────────────────────

function openJobDetail(id) {
  const job = getJobs().find(j => j.id === id);
  if (!job) return;
  viewingJobId = id;
  const lead = job.lead_id ? getLeads().find(l => l.id === job.lead_id) : null;

  document.getElementById('job-detail-title').textContent = job.title;
  document.getElementById('job-detail-body').innerHTML = `
    <div class="detail-row"><span class="detail-label">Status</span>${statusBadge(job.status)}</div>
    <div class="detail-row"><span class="detail-label">Customer</span><span>${lead ? lead.first_name + ' ' + lead.last_name : '-'}</span></div>
    <div class="detail-row"><span class="detail-label">Service</span><span>${formatServiceType(job.service_type)}</span></div>
    <div class="detail-row"><span class="detail-label">Scheduled</span><span>${formatDate(job.scheduled_date)} ${job.scheduled_time || ''}</span></div>
    <div class="detail-row"><span class="detail-label">Amount</span><span>${formatCurrency(job.amount)}</span></div>
    <div class="detail-row"><span class="detail-label">Paid</span><span>${job.paid ? '✅ Yes' : '❌ No'}</span></div>
    <div class="detail-row"><span class="detail-label">Crew</span><span>${job.crew || '-'}</span></div>
    <div class="detail-row"><span class="detail-label">Address</span><span>${job.address || '-'}</span></div>
    ${job.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span>${job.notes}</span></div>` : ''}
  `;

  document.getElementById('job-detail-overlay').classList.add('open');
}

document.getElementById('job-detail-close').addEventListener('click', () => document.getElementById('job-detail-overlay').classList.remove('open'));
document.getElementById('job-detail-edit').addEventListener('click', () => openEditJob(viewingJobId));
document.getElementById('job-detail-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); });

// ─── Calendar ─────────────────────────────────────────────────────────────────

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-year').textContent = `${months[currentMonth]} ${currentYear}`;

  const jobs = getJobs().filter(j => j.scheduled_date);
  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${daysInPrev - i}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const dayJobs = jobs.filter(j => j.scheduled_date === dateStr);
    const chips = dayJobs.map(j => `
      <div class="cal-chip cal-chip-${j.status}" onclick="event.stopPropagation();openJobDetail(${j.id})" title="${j.title}">
        ${j.scheduled_time ? j.scheduled_time.slice(0,5)+' ' : ''}${j.title.length > 13 ? j.title.slice(0,13)+'…' : j.title}
      </div>
    `).join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}"><div class="cal-day-num">${d}</div>${chips}</div>`;
  }

  const total = firstDay + daysInMonth;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  document.getElementById('calendar-grid').innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

seedIfEmpty();
loadDashboard();
