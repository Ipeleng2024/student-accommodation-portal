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
        <span class="property-area">${p.area} · ${p.occupancyRate}% occupied · ${money(p.monthlyRevenue)}/mo</span>
      </div>
      <div class="occupancy-bar-track"><div class="occupancy-bar-fill" style="width:${p.occupancyRate}%"></div></div>
      <div class="room-toggle-grid" data-property="${p.id}"></div>
      <p class="hint-text">Click a room to flip it between available and occupied.</p>
    `;

    const grid = section.querySelector('.room-toggle-grid');
    p.rooms.forEach((r) => {
      const btn = document.createElement('button');
      btn.className = `room-toggle ${r.status}`;
      btn.textContent = r.id;
      btn.title = `${r.id} · ${r.type} · ${money(r.priceMonthly)}/mo · ${r.status}`;
      btn.addEventListener('click', () => toggleRoom(p.id, r.id, r.status, btn));
      grid.appendChild(btn);
    });

    container.appendChild(section);
  });
}

async function toggleRoom(propertyId, roomId, currentStatus, btn) {
  const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
  btn.disabled = true;

  const res = await fetch(`/api/manager/rooms/${propertyId}/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });

  btn.disabled = false;

  if (res.ok) {
    loadDashboard(); // re-render everything so stats/revenue stay accurate
  } else {
    alert('Could not update that room. Try again.');
  }
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/manager/logout', { method: 'POST' });
  window.location.href = '/manager-login.html';
});

(async () => {
  const session = await checkSession();
  if (session) loadDashboard();
})();
