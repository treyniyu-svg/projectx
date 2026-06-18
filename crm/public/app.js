const API = 'http://localhost:3001/api';

let currentTab = 'dashboard';
let editingLeadId = null;
let editingJobId = null;
let viewingJobId = null;
let calYear, calMonth;
let allCalJobs = [];
let dragJobId = null;

// ── Navigation ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));
  const titles = { dashboard: 'Dashboard', leads: 'Leads', pipeline: 'Pipeline', calendar: 'Calendar' };
  document.getElementById('page-title').textContent = titles[tab];
  closePanel();
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'leads') loadLeads();
  if (tab === 'pipeline') loadKanban();
  if (tab === 'calendar') loadCalendar();
}

// ── Dashboard ─────────────────────────────────────────────────
async function loadDashboard() {
  const data = await fetch(`${API}/dashboard`).then(r => r.json());

  document.getElementById('stat-leads').textContent = data.totalLeads;
  document.getElementById('stat-new-leads').textContent = `${data.newLeads} new`;
  document.getElementById('stat-revenue').textContent = `$${Number(data.revenue).toLocaleString()}`;
  document.getElementById('stat-jobs').textContent = data.jobsBooked;
  document.getElementById('stat-conversion').textContent = `${data.conversionRate}%`;

  drawBarChart(data.monthlyLeads);
  drawDonutChart(data.jobsByStatus);

  const tbody = document.getElementById('recent-leads-body');
  tbody.innerHTML = data.recentLeads.map(l => `
    <tr class="clickable" onclick="openLeadPanel(${l.id})">
      <td>${l.first_name} ${l.last_name}</td>
      <td>${l.service_type || '—'}</td>
      <td><span class="badge badge-${l.status}">${l.status}</span></td>
      <td>$${Number(l.estimated_value).toLocaleString()}</td>
      <td>${formatDate(l.created_at)}</td>
    </tr>
  `).join('');
}

function drawBarChart(monthlyLeads) {
  const canvas = document.getElementById('chart-leads');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 500;
  canvas.height = 180;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!monthlyLeads.length) return;

  const max = Math.max(...monthlyLeads.map(m => m.count), 1);
  const barW = (canvas.width - 60) / monthlyLeads.length;
  const padL = 40, padB = 30, padT = 10;
  const chartH = canvas.height - padB - padT;

  monthlyLeads.forEach((m, i) => {
    const x = padL + i * barW + barW * 0.15;
    const bw = barW * 0.7;
    const h = (m.count / max) * chartH;
    const y = padT + chartH - h;

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(x, y, bw, h, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(m.month ? m.month.slice(5) : '', x + bw / 2, canvas.height - 8);

    ctx.fillStyle = '#0f172a';
    ctx.font = '11px Inter';
    ctx.fillText(m.count, x + bw / 2, y - 4);
  });

  // Y axis
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL - 5, padT);
  ctx.lineTo(padL - 5, padT + chartH);
  ctx.stroke();
}

function drawDonutChart(jobsByStatus) {
  const canvas = document.getElementById('chart-jobs');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 200;
  canvas.height = 180;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = { new: '#94a3b8', quoted: '#f59e0b', booked: '#10b981', in_progress: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };
  const total = jobsByStatus.reduce((s, j) => s + j.count, 0);
  if (!total) return;

  const cx = canvas.width / 2, cy = canvas.height / 2 - 10, r = Math.min(cx, cy) - 20;
  let angle = -Math.PI / 2;

  jobsByStatus.forEach(j => {
    const slice = (j.count / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[j.status] || '#cbd5e1';
    ctx.fill();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 4);
  ctx.font = '11px Inter';
  ctx.fillStyle = '#64748b';
  ctx.fillText('total jobs', cx, cy + 18);

  // Legend
  let lx = 8, ly = canvas.height - 24;
  jobsByStatus.forEach(j => {
    ctx.fillStyle = colors[j.status] || '#cbd5e1';
    ctx.fillRect(lx, ly, 10, 10);
    ctx.fillStyle = '#475569';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${j.status} (${j.count})`, lx + 13, ly + 9);
    lx += ctx.measureText(`${j.status} (${j.count})`).width + 26;
    if (lx > canvas.width - 60) { lx = 8; ly -= 16; }
  });
}

// ── Leads ─────────────────────────────────────────────────────
async function loadLeads() {
  const search = document.getElementById('leads-search').value;
  const status = document.getElementById('leads-status-filter').value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status !== 'all') params.set('status', status);

  const leads = await fetch(`${API}/leads?${params}`).then(r => r.json());

  document.getElementById('leads-body').innerHTML = leads.map(l => `
    <tr class="clickable">
      <td onclick="openLeadPanel(${l.id})">${l.first_name} ${l.last_name}</td>
      <td>${l.phone || '—'}</td>
      <td>${l.service_type || '—'}</td>
      <td><span class="badge badge-${l.status}">${l.status}</span></td>
      <td>$${Number(l.estimated_value).toLocaleString()}</td>
      <td>${l.source || '—'}</td>
      <td>${formatDate(l.created_at)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openEditLead(${l.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteLead(${l.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('leads-search').addEventListener('input', loadLeads);
document.getElementById('leads-status-filter').addEventListener('change', loadLeads);

// ── Lead Panel ────────────────────────────────────────────────
async function openLeadPanel(id) {
  const data = await fetch(`${API}/leads/${id}`).then(r => r.json());
  document.getElementById('panel-lead-name').textContent = `${data.first_name} ${data.last_name}`;

  const typeIcon = { note: 'fa-note-sticky', call: 'fa-phone', email: 'fa-envelope', status_change: 'fa-arrow-right-arrow-left' };

  document.getElementById('panel-body').innerHTML = `
    <div class="detail-row"><div class="detail-label">Status</div><div class="detail-value"><span class="badge badge-${data.status}">${data.status}</span></div></div>
    <div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value">${data.phone || '—'}</div></div>
    <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${data.email || '—'}</div></div>
    <div class="detail-row"><div class="detail-label">Service</div><div class="detail-value">${data.service_type || '—'}</div></div>
    <div class="detail-row"><div class="detail-label">Address</div><div class="detail-value">${data.address || '—'}</div></div>
    <div class="detail-row"><div class="detail-label">Est. Value</div><div class="detail-value">$${Number(data.estimated_value).toLocaleString()}</div></div>
    <div class="detail-row"><div class="detail-label">Source</div><div class="detail-value">${data.source || '—'}</div></div>
    <div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">${data.notes || '—'}</div></div>
    <div class="detail-row" style="margin-top:12px">
      <button class="btn btn-primary btn-sm" onclick="openEditLead(${data.id})"><i class="fa-solid fa-pen"></i> Edit Lead</button>
    </div>
    <div class="timeline" style="margin-top:20px">
      <div class="card-title">Activity</div>
      ${data.activities.length ? data.activities.map(a => `
        <div class="timeline-item">
          <div class="timeline-dot"><i class="fa-solid ${typeIcon[a.type] || 'fa-circle-dot'}"></i></div>
          <div class="timeline-content">
            <div class="t-desc">${a.description}</div>
            <div class="t-time">${formatDate(a.created_at)}</div>
          </div>
        </div>
      `).join('') : '<p style="color:#94a3b8;font-size:13px">No activity yet.</p>'}
    </div>
    <div class="add-note-form" style="margin-top:16px">
      <input type="text" id="note-input-${data.id}" placeholder="Add a note…">
      <button class="btn btn-primary btn-sm" onclick="addNote(${data.id})">Add</button>
    </div>
  `;

  document.getElementById('slide-panel').classList.add('open');
  document.getElementById('panel-dim').classList.add('show');
}

async function addNote(leadId) {
  const input = document.getElementById(`note-input-${leadId}`);
  const text = input.value.trim();
  if (!text) return;
  await fetch(`${API}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId, type: 'note', description: text })
  });
  openLeadPanel(leadId);
}

function closePanel() {
  document.getElementById('slide-panel').classList.remove('open');
  document.getElementById('panel-dim').classList.remove('show');
}
document.getElementById('panel-close').addEventListener('click', closePanel);
document.getElementById('panel-dim').addEventListener('click', closePanel);

// ── Lead Modal ────────────────────────────────────────────────
function openAddLead() {
  editingLeadId = null;
  document.getElementById('lead-modal-title').textContent = 'Add Lead';
  ['first-name','last-name','phone','email','address','notes'].forEach(f => document.getElementById(`lf-${f}`).value = '');
  document.getElementById('lf-service').value = '';
  document.getElementById('lf-status').value = 'new';
  document.getElementById('lf-source').value = '';
  document.getElementById('lf-value').value = '';
  document.getElementById('lead-modal-overlay').classList.add('open');
}

async function openEditLead(id) {
  const data = await fetch(`${API}/leads/${id}`).then(r => r.json());
  editingLeadId = id;
  document.getElementById('lead-modal-title').textContent = 'Edit Lead';
  document.getElementById('lf-first-name').value = data.first_name || '';
  document.getElementById('lf-last-name').value = data.last_name || '';
  document.getElementById('lf-phone').value = data.phone || '';
  document.getElementById('lf-email').value = data.email || '';
  document.getElementById('lf-service').value = data.service_type || '';
  document.getElementById('lf-status').value = data.status || 'new';
  document.getElementById('lf-source').value = data.source || '';
  document.getElementById('lf-value').value = data.estimated_value || '';
  document.getElementById('lf-address').value = data.address || '';
  document.getElementById('lf-notes').value = data.notes || '';
  document.getElementById('lead-modal-overlay').classList.add('open');
}

document.getElementById('btn-add-lead').addEventListener('click', openAddLead);
document.getElementById('lead-modal-cancel').addEventListener('click', () => document.getElementById('lead-modal-overlay').classList.remove('open'));

document.getElementById('lead-modal-save').addEventListener('click', async () => {
  const body = {
    first_name: document.getElementById('lf-first-name').value.trim(),
    last_name: document.getElementById('lf-last-name').value.trim(),
    phone: document.getElementById('lf-phone').value.trim(),
    email: document.getElementById('lf-email').value.trim(),
    service_type: document.getElementById('lf-service').value,
    status: document.getElementById('lf-status').value,
    source: document.getElementById('lf-source').value,
    estimated_value: parseFloat(document.getElementById('lf-value').value) || 0,
    address: document.getElementById('lf-address').value.trim(),
    notes: document.getElementById('lf-notes').value.trim(),
  };
  if (!body.first_name || !body.last_name) return alert('First and last name are required.');

  const url = editingLeadId ? `${API}/leads/${editingLeadId}` : `${API}/leads`;
  const method = editingLeadId ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  document.getElementById('lead-modal-overlay').classList.remove('open');
  if (currentTab === 'leads') loadLeads();
  if (currentTab === 'dashboard') loadDashboard();
});

async function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  await fetch(`${API}/leads/${id}`, { method: 'DELETE' });
  loadLeads();
}

// ── Job Modal ─────────────────────────────────────────────────
async function openAddJob() {
  editingJobId = null;
  document.getElementById('job-modal-title').textContent = 'Add Job';
  ['title','crew','address','notes'].forEach(f => document.getElementById(`jf-${f}`).value = '');
  document.getElementById('jf-service').value = '';
  document.getElementById('jf-status').value = 'new';
  document.getElementById('jf-amount').value = '';
  document.getElementById('jf-date').value = '';
  document.getElementById('jf-time').value = '';
  document.getElementById('jf-paid').value = '0';
  await populateLeadDropdown();
  document.getElementById('job-modal-overlay').classList.add('open');
}

async function openEditJob(id) {
  const data = await fetch(`${API}/jobs/${id}`).then(r => r.json());
  editingJobId = id;
  document.getElementById('job-modal-title').textContent = 'Edit Job';
  document.getElementById('jf-title').value = data.title || '';
  document.getElementById('jf-status').value = data.status || 'new';
  document.getElementById('jf-service').value = data.service_type || '';
  document.getElementById('jf-date').value = data.scheduled_date || '';
  document.getElementById('jf-time').value = data.scheduled_time || '';
  document.getElementById('jf-amount').value = data.amount || '';
  document.getElementById('jf-paid').value = data.paid ? '1' : '0';
  document.getElementById('jf-crew').value = data.crew || '';
  document.getElementById('jf-address').value = data.address || '';
  document.getElementById('jf-notes').value = data.notes || '';
  await populateLeadDropdown(data.lead_id);
  document.getElementById('job-modal-overlay').classList.add('open');
}

async function populateLeadDropdown(selectedId) {
  const leads = await fetch(`${API}/leads-list`).then(r => r.json());
  const sel = document.getElementById('jf-lead');
  sel.innerHTML = '<option value="">No lead</option>' + leads.map(l =>
    `<option value="${l.id}" ${l.id == selectedId ? 'selected' : ''}>${l.first_name} ${l.last_name}</option>`
  ).join('');
}

document.getElementById('btn-add-job').addEventListener('click', openAddJob);
document.getElementById('job-modal-cancel').addEventListener('click', () => document.getElementById('job-modal-overlay').classList.remove('open'));

document.getElementById('job-modal-save').addEventListener('click', async () => {
  const body = {
    lead_id: document.getElementById('jf-lead').value || null,
    title: document.getElementById('jf-title').value.trim(),
    status: document.getElementById('jf-status').value,
    service_type: document.getElementById('jf-service').value,
    scheduled_date: document.getElementById('jf-date').value,
    scheduled_time: document.getElementById('jf-time').value,
    amount: parseFloat(document.getElementById('jf-amount').value) || 0,
    paid: document.getElementById('jf-paid').value === '1',
    crew: document.getElementById('jf-crew').value.trim(),
    address: document.getElementById('jf-address').value.trim(),
    notes: document.getElementById('jf-notes').value.trim(),
  };
  if (!body.title) return alert('Job title is required.');

  const url = editingJobId ? `${API}/jobs/${editingJobId}` : `${API}/jobs`;
  const method = editingJobId ? 'PUT' : 'POST';
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  document.getElementById('job-modal-overlay').classList.remove('open');
  if (currentTab === 'pipeline') loadKanban();
  if (currentTab === 'calendar') loadCalendar();
});

// ── Job Detail Modal ──────────────────────────────────────────
async function openJobDetail(id) {
  viewingJobId = id;
  const data = await fetch(`${API}/jobs/${id}`).then(r => r.json());
  document.getElementById('jd-title').textContent = data.title;
  document.getElementById('jd-body').innerHTML = `
    <div class="form-grid" style="margin-bottom:0">
      <div class="detail-row"><div class="detail-label">Status</div><div class="detail-value"><span class="badge badge-${data.status}">${data.status}</span></div></div>
      <div class="detail-row"><div class="detail-label">Customer</div><div class="detail-value">${data.first_name ? data.first_name + ' ' + data.last_name : '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Service</div><div class="detail-value">${data.service_type || '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Scheduled</div><div class="detail-value">${data.scheduled_date || '—'} ${data.scheduled_time || ''}</div></div>
      <div class="detail-row"><div class="detail-label">Amount</div><div class="detail-value">$${Number(data.amount).toLocaleString()}</div></div>
      <div class="detail-row"><div class="detail-label">Paid</div><div class="detail-value">${data.paid ? '✅ Yes' : '❌ No'}</div></div>
      <div class="detail-row"><div class="detail-label">Crew</div><div class="detail-value">${data.crew || '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Address</div><div class="detail-value">${data.address || '—'}</div></div>
      <div class="detail-row" style="grid-column:1/-1"><div class="detail-label">Notes</div><div class="detail-value">${data.notes || '—'}</div></div>
    </div>
  `;
  document.getElementById('job-detail-overlay').classList.add('open');
}

document.getElementById('jd-close').addEventListener('click', () => document.getElementById('job-detail-overlay').classList.remove('open'));
document.getElementById('jd-edit').addEventListener('click', () => {
  document.getElementById('job-detail-overlay').classList.remove('open');
  openEditJob(viewingJobId);
});

// Close modals on overlay click
['lead-modal-overlay','job-modal-overlay','job-detail-overlay'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
});

// ── Kanban ────────────────────────────────────────────────────
async function loadKanban() {
  const jobs = await fetch(`${API}/jobs`).then(r => r.json());
  const statuses = ['new','quoted','booked','in_progress','completed'];

  statuses.forEach(status => {
    const col = document.getElementById(`col-${status}`);
    const cnt = document.getElementById(`cnt-${status}`);
    const colJobs = jobs.filter(j => j.status === status);
    cnt.textContent = colJobs.length;
    col.innerHTML = colJobs.map(j => `
      <div class="kanban-card" draggable="true" data-id="${j.id}" onclick="openJobDetail(${j.id})">
        <div class="card-title-sm">${j.title}</div>
        <div class="card-meta"><i class="fa-solid fa-user" style="font-size:10px"></i> ${j.first_name ? j.first_name + ' ' + j.last_name : 'No customer'}</div>
        <div class="card-meta"><i class="fa-solid fa-wrench" style="font-size:10px"></i> ${j.service_type || '—'}</div>
        ${j.scheduled_date ? `<div class="card-meta"><i class="fa-solid fa-calendar" style="font-size:10px"></i> ${j.scheduled_date}</div>` : ''}
        <div class="card-amount">$${Number(j.amount).toLocaleString()}</div>
      </div>
    `).join('');
  });

  initDragDrop();
}

function initDragDrop() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragJobId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const newStatus = col.dataset.status;
      if (!dragJobId) return;

      const job = await fetch(`${API}/jobs/${dragJobId}`).then(r => r.json());
      await fetch(`${API}/jobs/${dragJobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: newStatus })
      });
      loadKanban();
    });
  });
}

// ── Calendar ──────────────────────────────────────────────────
async function loadCalendar() {
  const now = new Date();
  if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }
  allCalJobs = await fetch(`${API}/calendar`).then(r => r.json());
  renderCalendar();
}

function renderCalendar() {
  const label = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('cal-month-label').textContent = label;

  const grid = document.getElementById('cal-grid');
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const today = new Date();

  // Prev month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="day-num">${daysInPrev - i}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const dayJobs = allCalJobs.filter(j => j.scheduled_date === dateStr);

    const chips = dayJobs.map(j => `
      <div class="cal-job-chip ${j.status}" onclick="event.stopPropagation();openJobDetail(${j.id})" title="${j.title}">
        ${j.scheduled_time ? j.scheduled_time.slice(0,5) + ' ' : ''}${j.title.length > 14 ? j.title.slice(0,14)+'…' : j.title}
      </div>
    `).join('');

    html += `<div class="cal-day ${isToday ? 'today' : ''}">
      <div class="day-num">${d}</div>
      ${chips}
    </div>`;
  }

  // Fill remaining cells
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month"><div class="day-num">${i}</div></div>`;
  }

  grid.innerHTML = html;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

// ── Helpers ───────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Init ──────────────────────────────────────────────────────
loadDashboard();
