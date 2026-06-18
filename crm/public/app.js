const API = '/api';
let currentTab = 'dashboard';
let leads = [];
let jobs = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let draggedJobId = null;
let calendarJobs = [];

// ─── Utilities ────────────────────────────────────────────────────────────────

function statusBadge(status) {
  if (!status) return '';
  return `<span class="badge badge-${status}">${status.replace(/_/g, ' ')}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '$0.00';
  return '$' + parseFloat(amount).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatServiceType(type) {
  if (!type) return '-';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatActivityType(type) {
  const map = { note: 'Note', call: 'Call', email: 'Email', status_change: 'Status Change', visit: 'Visit' };
  return map[type] || type;
}

// ─── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

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

// ─── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    const data = await fetch(`${API}/dashboard`).then(r => r.json());
    document.getElementById('stat-total-leads').textContent = data.total_leads;
    document.getElementById('stat-monthly-revenue').textContent = formatCurrency(data.monthly_revenue);
    document.getElementById('stat-jobs-booked').textContent = data.jobs_booked;
    document.getElementById('stat-conversion-rate').textContent = parseFloat(data.conversion_rate).toFixed(1) + '%';
    drawBarChart(data.monthly_trend || []);
    drawDonutChart(data.jobs_by_status || []);
    renderRecentLeads(data.recent_leads || []);
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

function renderRecentLeads(recentLeads) {
  const tbody = document.getElementById('recent-leads-tbody');
  if (!tbody) return;
  tbody.innerHTML = recentLeads.map(l => `
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
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  if (!trend || trend.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', W / 2, H / 2);
    return;
  }

  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxCount = Math.max(...trend.map(t => t.count), 1);
  const gridLines = 5;

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + chartH - (i / gridLines) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();

    // Y labels
    const val = Math.round((i / gridLines) * maxCount);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, padL - 6, y + 4);
  }

  const barWidth = Math.min(chartW / trend.length - 8, 48);
  const gap = (chartW - barWidth * trend.length) / (trend.length + 1);

  trend.forEach((item, i) => {
    const barH = (item.count / maxCount) * chartH;
    const x = padL + gap + i * (barWidth + gap);
    const y = padT + chartH - barH;

    // Bar
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    const radius = Math.min(4, barH / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Count label on bar
    if (item.count > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.count, x + barWidth / 2, y - 4);
    }

    // Month label
    const monthStr = item.month ? item.month.substring(0, 7) : '';
    let label = monthStr;
    if (monthStr.length >= 7) {
      const [yr, mo] = monthStr.split('-');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      label = (months[parseInt(mo) - 1] || mo) + ' ' + yr.slice(2);
    }
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth / 2, padT + chartH + 18);
  });
}

function drawDonutChart(statusData) {
  const canvas = document.getElementById('donut-chart');
  const legendEl = document.getElementById('donut-legend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const colors = ['#3b82f6', '#f59e0b', '#22c55e', '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6'];

  if (!statusData || statusData.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', W / 2, H / 2);
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const total = statusData.reduce((s, d) => s + (d.count || 0), 0);
  if (total === 0) {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 90, 0, Math.PI * 2);
    ctx.fill();
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const cx = W / 2;
  const cy = H / 2;
  const outerR = 90;
  const innerR = 52;
  let startAngle = -Math.PI / 2;

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

  // Hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('total jobs', cx, cy + 10);
  ctx.textBaseline = 'alphabetic';

  // Legend
  if (legendEl) {
    legendEl.innerHTML = statusData.map((item, i) => `
      <div class="donut-legend-item">
        <div class="donut-legend-color" style="background:${colors[i % colors.length]}"></div>
        <span>${item.status.replace(/_/g, ' ')} &mdash; ${item.count}</span>
      </div>
    `).join('');
  }
}

// ─── Leads ─────────────────────────────────────────────────────────────────────

async function loadLeads() {
  const search = document.getElementById('leads-search').value;
  const status = document.getElementById('leads-status-filter').value;
  let url = `${API}/leads?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (status) url += `status=${encodeURIComponent(status)}`;
  try {
    leads = await fetch(url).then(r => r.json());
    renderLeadsTable();
  } catch (e) {
    console.error('Load leads error:', e);
  }
}

function renderLeadsTable() {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;
  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:32px">No leads found</td></tr>';
    return;
  }
  tbody.innerHTML = leads.map(l => `
    <tr>
      <td style="cursor:pointer;font-weight:500" onclick="openLeadPanel(${l.id})">${l.first_name} ${l.last_name}</td>
      <td>${l.phone || '-'}</td>
      <td>${l.email || '-'}</td>
      <td>${formatServiceType(l.service_type)}</td>
      <td>${statusBadge(l.status)}</td>
      <td>${formatCurrency(l.estimated_value)}</td>
      <td>${formatDate(l.created_at)}</td>
      <td>
        <button class="btn-icon" onclick="openLeadModal(${JSON.stringify(l).replace(/"/g, '&quot;')})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" onclick="deleteLead(${l.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ─── Lead Panel ────────────────────────────────────────────────────────────────

async function openLeadPanel(id) {
  try {
    const lead = await fetch(`${API}/leads/${id}`).then(r => r.json());
    document.getElementById('panel-lead-name').textContent = `${lead.first_name} ${lead.last_name}`;

    const activitiesHtml = (lead.activities || []).length === 0
      ? '<p style="color:#94a3b8;font-size:14px">No activity yet</p>'
      : (lead.activities || []).map(a => `
          <div class="activity-item">
            <div class="activity-dot"></div>
            <div class="activity-content">
              <p><strong>${formatActivityType(a.type)}:</strong> ${a.description}</p>
              <small>${formatDate(a.created_at)}</small>
            </div>
          </div>
        `).join('');

    const jobsHtml = (lead.jobs || []).length === 0
      ? '<p style="color:#94a3b8;font-size:14px">No jobs linked</p>'
      : (lead.jobs || []).map(j => `
          <div style="background:#f8fafc;border-radius:8px;padding:10px;margin-bottom:8px;font-size:13px">
            <div style="font-weight:600;margin-bottom:4px">${j.title}</div>
            <div style="color:#64748b">${statusBadge(j.status)} &nbsp; ${formatCurrency(j.amount)} &nbsp; ${j.scheduled_date ? formatDate(j.scheduled_date) : 'No date'}</div>
          </div>
        `).join('');

    document.getElementById('panel-body').innerHTML = `
      <div class="panel-section">
        <h4>Contact Info</h4>
        <div class="panel-field"><div class="label">Phone</div><span>${lead.phone || '-'}</span></div>
        <div class="panel-field"><div class="label">Email</div><span>${lead.email || '-'}</span></div>
        <div class="panel-field"><div class="label">Address</div><span>${lead.address || '-'}</span></div>
        <div class="panel-field"><div class="label">Source</div><span>${lead.source ? lead.source.replace(/\b\w/g, l => l.toUpperCase()) : '-'}</span></div>
      </div>
      <div class="panel-section">
        <h4>Lead Details</h4>
        <div class="panel-field"><div class="label">Service Type</div><span>${formatServiceType(lead.service_type)}</span></div>
        <div class="panel-field"><div class="label">Status</div>${statusBadge(lead.status)}</div>
        <div class="panel-field"><div class="label">Estimated Value</div><span>${formatCurrency(lead.estimated_value)}</span></div>
        <div class="panel-field"><div class="label">Created</div><span>${formatDate(lead.created_at)}</span></div>
        ${lead.notes ? `<div class="panel-field"><div class="label">Notes</div><span>${lead.notes}</span></div>` : ''}
      </div>
      <div class="panel-section">
        <h4>Jobs</h4>
        ${jobsHtml}
      </div>
      <div class="panel-section">
        <h4>Activity Timeline</h4>
        ${activitiesHtml}
        <div class="add-note-form">
          <textarea class="note-input-area" id="note-text" placeholder="Add a note..."></textarea>
          <button class="btn btn-primary" id="add-note-btn" style="align-self:flex-end"><i class="fas fa-plus"></i> Add Note</button>
        </div>
      </div>
    `;

    document.getElementById('panel-overlay').classList.add('active');
    document.getElementById('lead-panel').classList.add('active');

    document.getElementById('add-note-btn').addEventListener('click', async () => {
      const text = document.getElementById('note-text').value.trim();
      if (!text) return;
      await fetch(`${API}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id, type: 'note', description: text })
      });
      openLeadPanel(id);
    });
  } catch (e) {
    console.error('Open lead panel error:', e);
  }
}

function closeLeadPanel() {
  document.getElementById('panel-overlay').classList.remove('active');
  document.getElementById('lead-panel').classList.remove('active');
}

// ─── Lead Modal ────────────────────────────────────────────────────────────────

function openLeadModal(lead = null) {
  document.getElementById('lead-id').value = lead ? lead.id : '';
  document.getElementById('lead-first-name').value = lead ? lead.first_name : '';
  document.getElementById('lead-last-name').value = lead ? lead.last_name : '';
  document.getElementById('lead-phone').value = lead ? (lead.phone || '') : '';
  document.getElementById('lead-email').value = lead ? (lead.email || '') : '';
  document.getElementById('lead-address').value = lead ? (lead.address || '') : '';
  document.getElementById('lead-service-type').value = lead ? (lead.service_type || '') : '';
  document.getElementById('lead-status').value = lead ? (lead.status || 'new') : 'new';
  document.getElementById('lead-source').value = lead ? (lead.source || '') : '';
  document.getElementById('lead-estimated-value').value = lead ? (lead.estimated_value || '') : '';
  document.getElementById('lead-notes').value = lead ? (lead.notes || '') : '';
  document.getElementById('lead-modal-title').textContent = lead ? 'Edit Lead' : 'Add Lead';
  document.getElementById('lead-modal-overlay').classList.add('active');
}

function closeLeadModal() {
  document.getElementById('lead-modal-overlay').classList.remove('active');
}

async function submitLeadForm(e) {
  e.preventDefault();
  const id = document.getElementById('lead-id').value;
  const data = {
    first_name: document.getElementById('lead-first-name').value,
    last_name: document.getElementById('lead-last-name').value,
    phone: document.getElementById('lead-phone').value,
    email: document.getElementById('lead-email').value,
    address: document.getElementById('lead-address').value,
    service_type: document.getElementById('lead-service-type').value,
    status: document.getElementById('lead-status').value,
    source: document.getElementById('lead-source').value,
    estimated_value: parseFloat(document.getElementById('lead-estimated-value').value) || 0,
    notes: document.getElementById('lead-notes').value
  };

  try {
    if (id) {
      await fetch(`${API}/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch(`${API}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    closeLeadModal();
    if (currentTab === 'leads') loadLeads();
    if (currentTab === 'dashboard') loadDashboard();
  } catch (err) {
    console.error('Submit lead error:', err);
  }
}

async function deleteLead(id) {
  if (!confirm('Delete this lead and all associated data?')) return;
  try {
    await fetch(`${API}/leads/${id}`, { method: 'DELETE' });
    loadLeads();
    if (currentTab === 'dashboard') loadDashboard();
  } catch (e) {
    console.error('Delete lead error:', e);
  }
}

// ─── Pipeline / Kanban ──────────────────────────────────────────────────────────

async function loadPipeline() {
  try {
    jobs = await fetch(`${API}/jobs`).then(r => r.json());

    ['new', 'quoted', 'booked', 'in_progress', 'completed'].forEach(status => {
      const col = document.getElementById(`col-${status}`);
      const cnt = document.getElementById(`col-count-${status}`);
      if (col) col.innerHTML = '';
      if (cnt) cnt.textContent = '0';
    });

    jobs.forEach(job => {
      const col = document.getElementById(`col-${job.status}`);
      if (!col) return;

      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.dataset.jobId = job.id;
      card.innerHTML = `
        <div class="kanban-card-title">${job.title}</div>
        <div class="kanban-card-meta">
          <span><i class="fas fa-user" style="width:12px;margin-right:4px"></i>${job.first_name || ''} ${job.last_name || ''}</span>
          <span><i class="fas fa-dollar-sign" style="width:12px;margin-right:4px"></i>${formatCurrency(job.amount)}</span>
          ${job.scheduled_date ? `<span><i class="fas fa-calendar" style="width:12px;margin-right:4px"></i>${formatDate(job.scheduled_date)}</span>` : ''}
        </div>
      `;

      card.addEventListener('dragstart', e => {
        draggedJobId = job.id;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => card.style.opacity = '0.5', 0);
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        draggedJobId = null;
      });
      card.addEventListener('click', () => showJobDetail(job));
      col.appendChild(card);

      const countEl = document.getElementById(`col-count-${job.status}`);
      if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
    });

    document.querySelectorAll('.kanban-cards').forEach(colEl => {
      colEl.addEventListener('dragover', e => {
        e.preventDefault();
        colEl.closest('.kanban-column').classList.add('drag-over');
      });
      colEl.addEventListener('dragleave', e => {
        if (!colEl.contains(e.relatedTarget)) {
          colEl.closest('.kanban-column').classList.remove('drag-over');
        }
      });
      colEl.addEventListener('drop', e => {
        e.preventDefault();
        colEl.closest('.kanban-column').classList.remove('drag-over');
        const newStatus = colEl.closest('.kanban-column').dataset.status;
        if (draggedJobId) moveJob(draggedJobId, newStatus);
      });
    });
  } catch (e) {
    console.error('Load pipeline error:', e);
  }
}

async function moveJob(id, status) {
  try {
    await fetch(`${API}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadPipeline();
  } catch (e) {
    console.error('Move job error:', e);
  }
}

function showJobDetail(job) {
  const lines = [
    `Job: ${job.title}`,
    `Status: ${job.status}`,
    `Amount: ${formatCurrency(job.amount)}`,
    `Date: ${job.scheduled_date ? formatDate(job.scheduled_date) : 'Not scheduled'}`,
    `Time: ${job.scheduled_time || 'Not set'}`,
    `Crew: ${job.crew || 'Not assigned'}`,
    `Address: ${job.address || '-'}`,
    `Notes: ${job.notes || 'None'}`
  ];
  alert(lines.join('\n'));
}

// ─── Job Modal ──────────────────────────────────────────────────────────────────

function openJobModal(job = null) {
  document.getElementById('job-id').value = job ? job.id : '';
  document.getElementById('job-title').value = job ? job.title : '';
  document.getElementById('job-service-type').value = job ? (job.service_type || '') : '';
  document.getElementById('job-status').value = job ? (job.status || 'new') : 'new';
  document.getElementById('job-scheduled-date').value = job ? (job.scheduled_date || '') : '';
  document.getElementById('job-scheduled-time').value = job ? (job.scheduled_time || '') : '';
  document.getElementById('job-address').value = job ? (job.address || '') : '';
  document.getElementById('job-amount').value = job ? (job.amount || '') : '';
  document.getElementById('job-crew').value = job ? (job.crew || '') : '';
  document.getElementById('job-notes').value = job ? (job.notes || '') : '';
  document.getElementById('job-modal-title').textContent = job ? 'Edit Job' : 'Add Job';
  document.getElementById('job-modal-overlay').classList.add('active');
}

function closeJobModal() {
  document.getElementById('job-modal-overlay').classList.remove('active');
}

async function submitJobForm(e) {
  e.preventDefault();
  const id = document.getElementById('job-id').value;
  const data = {
    title: document.getElementById('job-title').value,
    service_type: document.getElementById('job-service-type').value,
    status: document.getElementById('job-status').value,
    scheduled_date: document.getElementById('job-scheduled-date').value,
    scheduled_time: document.getElementById('job-scheduled-time').value,
    address: document.getElementById('job-address').value,
    amount: parseFloat(document.getElementById('job-amount').value) || 0,
    crew: document.getElementById('job-crew').value,
    notes: document.getElementById('job-notes').value
  };

  try {
    if (id) {
      await fetch(`${API}/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch(`${API}/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    closeJobModal();
    if (currentTab === 'pipeline') loadPipeline();
    if (currentTab === 'calendar') renderCalendar();
    if (currentTab === 'dashboard') loadDashboard();
  } catch (err) {
    console.error('Submit job error:', err);
  }
}

// ─── Calendar ──────────────────────────────────────────────────────────────────

async function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;

  try {
    calendarJobs = await fetch(`${API}/calendar`).then(r => r.json());
  } catch (e) {
    calendarJobs = [];
    console.error('Calendar load error:', e);
  }

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();

  // Prev month padding
  for (let i = 0; i < firstDay; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.innerHTML = `<div class="cal-day-num">${prevMonthDays - firstDay + i + 1}</div>`;
    grid.appendChild(d);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = document.createElement('div');
    d.className = 'cal-day';

    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
    if (isToday) d.classList.add('today');

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    d.innerHTML = `<div class="cal-day-num">${day}</div>`;

    const dayJobs = calendarJobs.filter(j => j.scheduled_date === dateStr);
    dayJobs.forEach(job => {
      const chip = document.createElement('div');
      chip.className = 'job-chip';
      chip.textContent = job.title;
      chip.title = `${job.title}${job.first_name ? ' - ' + job.first_name + ' ' + job.last_name : ''}${job.scheduled_time ? ' @ ' + job.scheduled_time : ''}`;
      chip.addEventListener('click', () => showJobDetail(job));
      d.appendChild(chip);
    });

    grid.appendChild(d);
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.innerHTML = `<div class="cal-day-num">${i}</div>`;
    grid.appendChild(d);
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });

  // Add Lead button
  document.getElementById('add-lead-btn').addEventListener('click', () => openLeadModal());

  // Add Job button
  document.getElementById('add-job-btn').addEventListener('click', () => openJobModal());

  // Lead form submit
  document.getElementById('lead-form').addEventListener('submit', submitLeadForm);

  // Job form submit
  document.getElementById('job-form').addEventListener('submit', submitJobForm);

  // Lead modal close
  document.getElementById('lead-modal-close').addEventListener('click', closeLeadModal);
  document.getElementById('lead-cancel-btn').addEventListener('click', closeLeadModal);
  document.getElementById('lead-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('lead-modal-overlay')) closeLeadModal();
  });

  // Job modal close
  document.getElementById('job-modal-close').addEventListener('click', closeJobModal);
  document.getElementById('job-cancel-btn').addEventListener('click', closeJobModal);
  document.getElementById('job-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('job-modal-overlay')) closeJobModal();
  });

  // Panel close
  document.getElementById('panel-close').addEventListener('click', closeLeadPanel);
  document.getElementById('panel-overlay').addEventListener('click', closeLeadPanel);

  // Calendar prev/next
  document.getElementById('cal-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // Search/filter debounce on leads tab
  let searchTimeout;
  document.getElementById('leads-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadLeads, 300);
  });
  document.getElementById('leads-status-filter').addEventListener('change', () => loadLeads());

  // Initial load
  loadDashboard();
});
