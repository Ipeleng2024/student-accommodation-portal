function money(n) {
  return `R${n.toLocaleString()}`;
}

async function checkSession() {
  const res = await fetch('/api/tenant/session');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = '/tenant-login.html';
    return null;
  }
  document.getElementById('welcome').textContent = `Welcome, ${data.name}`;
  return data;
}

async function loadStatement() {
  const res = await fetch('/api/tenant/me');
  if (res.status === 401) {
    window.location.href = '/tenant-login.html';
    return;
  }
  const data = await res.json();
  renderStatement(data);
}

function renderStatement(data) {
  const container = document.getElementById('statement-container');
  const statusLabel = data.accountStatus === 'up_to_date' ? 'Account up to date' : 'Payment overdue';

  container.innerHTML = `
    <div class="statement-card">
      <span class="status-badge-lg ${data.accountStatus}">${statusLabel}</span>

      ${
        data.accountStatus === 'behind'
          ? `<div class="balance-highlight">${money(data.balanceDue)} due</div>`
          : ''
      }

      <div class="info-row">
        <span class="label">Property</span>
        <span class="value">${data.property ? data.property.name : '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">Room</span>
        <span class="value">${data.room ? data.room.id : '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">Monthly rent</span>
        <span class="value">${data.room ? money(data.room.priceMonthly) : '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">Last updated</span>
        <span class="value">${data.lastUpdated || '-'}</span>
      </div>
      ${
        data.note
          ? `<div class="info-row"><span class="label">Note from management</span><span class="value">${data.note}</span></div>`
          : ''
      }
    </div>
  `;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/tenant/logout', { method: 'POST' });
  window.location.href = '/tenant-login.html';
});

(async () => {
  const session = await checkSession();
  if (session) loadStatement();
})();
