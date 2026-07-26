const form = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/manager/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    window.location.href = '/manager-dashboard.html';
    return;
  }

  const data = await res.json().catch(() => ({}));
  errorMsg.textContent = data.error || 'Something went wrong. Try again.';
  errorMsg.style.display = 'block';
});
