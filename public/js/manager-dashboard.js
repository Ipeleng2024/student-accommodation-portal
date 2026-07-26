function money(n) {
  return `R${n.toLocaleString()}`;
}

async function checkSession() {
  const res = await fetch('/api/manager/session');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = '/manager-login.html';
    return null;
  }
  document.getElementById('welcome').textContent = `Welcome, ${data.name}`;
  return data;
}

async function loadDashboard() {
  const res = await fetch('/api/manager/dashboard');
  if (res.status === 401) {
    window.location.href = '/manager-login.html';
    return;
  }
  const data = await res.json();
  renderStats(data.totals);
  renderProperties(data.properties);
}

function renderStats(totals) {
  const row = document.getElementById('stat-row');
  row.innerHTML = `
    <div class="stat-card">
      <span class="label">Occupancy</span>
      <span class="value">${totals.occupancyRate}%</span>
      <div class="occupancy-bar-track"><div class="occupancy-bar-fill" style="width:${totals.occupancyRate}%"></div></div>
    </div>
    <div class="stat-card">
      <span class="label">Rooms occupied</span>
      <span class="value">${totals.occupied} / ${totals.total}</span>
    </div>
    <div class="stat-card">
      <span class="label">Monthly revenue (actual)</span>
      <span class="value">${money(totals.monthlyRevenue)}</span>
    </div>
    <div class="stat-card">
      <span class="label">Monthly revenue (potential, full occupancy)</span>
      <span class="value">${money(totals.potentialRevenue)}</span>
    </div>
  `;
}

function renderProperties(properties) {
  const container = document.getElementById('properties-dash');
  container.innerHTML = '';

  properties.forEach((p) => {
    const section = document.createElement('div');
    section.className = 'dash-property';
    section.innerHTML = `
      <div class="dash-property-head">
        <h3>${p.name}</h3>
        <span class="property-area">${p.area} - ${p.occupancyRate}% occupied - ${money(p.monthlyRevenue)}/mo</span>
      </div>
      <div class="occupancy-bar-track"><div class="occupancy-bar-fill" style="width:${p.occupancyRate}%"></div></div>
      <table class="rooms-table" style="margin-top:16px;">
        <thead>
          <tr>
            <th>Room</th>
            <th>Type</th>
            <th>Price / month</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody data-property="${p.id}"></tbody>
      </table>
    `;

    const tbody = section.querySelector('tbody');
    p.rooms.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td><input type="text" class="edit-type" value="${r.type}" style="width:80px; padding:5px; border:1px solid var(--line); border-radius:4px; font-family:var(--font-body); font-size:13px;" /></td>
        <td><input type="number" class="edit-price" value="${r.priceMonthly}" style="width:90px; padding:5px; border:1px solid var(--line); border-radius:4px; font-family:var(--font-body); font-size:13px;" /></td>
        <td><button class="btn-quiet toggle-room-btn" data-status="${r.status}" style="font-size:12px;">${r.status}</button></td>
        <td><button class="btn-quiet save-room-btn" style="font-size:12px;">Save</button></td>
      `;

      const statusBtn = tr.querySelector('.toggle-room-btn');
      statusBtn.addEventListener('click', () => {
        const newStatus = statusBtn.dataset.status === 'available' ? 'occupied' : 'available';
        statusBtn.dataset.status = newStatus;
        statusBtn.textContent = newStatus;
      });

      tr.querySelector('.save-room-btn').addEventListener('click', async () => {
        const type = tr.querySelector('.edit-type').value;
        const priceMonthly = tr.querySelector('.edit-price').value;
        const status = statusBtn.dataset.status;

        const res = await fetch(`/api/manager/rooms/${p.id}/${r.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, priceMonthly, status })
        });

        if (res.ok) {
          loadDashboard();
        } else {
          alert('Could not save that room. Try again.');
        }
      });

      tbody.appendChild(tr);
    });

    container.appendChild(section);
  });
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/manager/logout', { method: 'POST' });
  window.location.href = '/manager-login.html';
});

async function loadTenants() {
  const res = await fetch('/api/manager/tenants');
  if (res.status === 401) {
    window.location.href = '/manager-login.html';
    return;
  }
  const data = await res.json();
  renderTenants(data.tenants);
}

function renderTenants(tenants) {
  const tbody = document.getElementById('tenants-tbody');
  tbody.innerHTML = '';

  if (tenants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--sage);">No tenants yet. Add one above.</td></tr>`;
    return;
  }

  tenants.forEach((t) => {
    const tr = document.createElement('tr');
    const statusLabel = t.accountStatus === 'up_to_date' ? 'Up to date' : 'Behind';
    tr.innerHTML = `
      <td>${t.name}<br><span style="color:var(--sage); font-size:12px;">${t.email}</span></td>
      <td>${t.propertyName} - ${t.roomId}</td>
      <td><span class="status-pill ${t.accountStatus === 'up_to_date' ? 'available' : 'occupied'}">${statusLabel}</span></td>
      <td>${t.balanceDue ? money(t.balanceDue) : '-'}</td>
      <td><button class="btn-quiet toggle-status-btn" data-id="${t.id}" data-status="${t.accountStatus}">Flip status</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.toggle-status-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleTenantStatus(btn.dataset.id, btn.dataset.status));
  });
}

async function toggleTenantStatus(id, currentStatus) {
  const newStatus = currentStatus === 'up_to_date' ? 'behind' : 'up_to_date';
  let balanceDue = 0;

  if (newStatus === 'behind') {
    const input = prompt('Amount owed (R):', '3200');
    if (input === null) return;
    balanceDue = Number(input) || 0;
  }

  await fetch(`/api/manager/tenants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountStatus: newStatus, balanceDue })
  });

  loadTenants();
}

async function populateRoomOptions() {
  const res = await fetch('/api/manager/dashboard');
  const data = await res.json();
  const select = document.getElementById('new-room');
  select.innerHTML = '';

  data.properties.forEach((p) => {
    p.rooms
      .filter((r) => r.status === 'available')
      .forEach((r) => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ propertyId: p.id, roomId: r.id });
        opt.textContent = `${p.name} - ${r.id} - ${money(r.priceMonthly)}/mo`;
        select.appendChild(opt);
      });
  });

  if (select.options.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No available rooms';
    opt.disabled = true;
    select.appendChild(opt);
  }
}

document.getElementById('add-tenant-btn').addEventListener('click', async () => {
  const form = document.getElementById('add-tenant-form');
  const isHidden = form.style.display === 'none';
  form.style.display = isHidden ? 'block' : 'none';
  if (isHidden) await populateRoomOptions();
});

document.getElementById('submit-tenant-btn').addEventListener('click', async () => {
  const errorEl = document.getElementById('add-tenant-error');
  errorEl.style.display = 'none';

  const name = document.getElementById('new-name').value;
  const email = document.getElementById('new-email').value;
  const password = document.getElementById('new-password').value;
  const roomSelect = document.getElementById('new-room');

  if (!name || !email || !password || !roomSelect.value) {
    errorEl.textContent = 'Fill in every field and pick a room.';
    errorEl.style.display = 'block';
    return;
  }

  const { propertyId, roomId } = JSON.parse(roomSelect.value);

  const res = await fetch('/api/manager/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, propertyId, roomId })
  });

  if (res.ok) {
    document.getElementById('new-name').value = '';
    document.getElementById('new-email').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('add-tenant-form').style.display = 'none';
    loadTenants();
    loadDashboard();
  } else {
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Could not create tenant.';
    errorEl.style.display = 'block';
  }
});

async function loadComplaints() {
  const res = await fetch('/api/manager/complaints');
  if (res.status === 401) return;
  const data = await res.json();
  renderComplaints(data.complaints);
}

function renderComplaints(complaints) {
  const tbody = document.getElementById('complaints-tbody');
  tbody.innerHTML = '';

  if (complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--sage);">No complaints filed yet.</td></tr>`;
    return;
  }

  complaints.forEach((c) => {
    const tr = document.createElement('tr');
    tr.className = `complaint-row ${c.status}`;
    const filedDate = new Date(c.createdAt).toLocaleDateString();
    tr.innerHTML = `
      <td>${c.tenantName}</td>
      <td class="complaint-msg">${c.message}</td>
      <td>${filedDate}</td>
      <td><span class="status-pill ${c.status === 'open' ? 'occupied' : 'available'}">${c.status}</span></td>
      <td><button class="btn-quiet complaint-toggle-btn" data-id="${c.id}" data-status="${c.status}">
        ${c.status === 'open' ? 'Mark resolved' : 'Reopen'}
      </button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.complaint-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status === 'open' ? 'resolved' : 'open';
      await fetch(`/api/manager/complaints/${btn.dataset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      loadComplaints();
    });
  });
}

(async () => {
  const session = await checkSession();
  if (session) {
    loadDashboard();
    loadTenants();
    loadComplaints();
  }
})();
