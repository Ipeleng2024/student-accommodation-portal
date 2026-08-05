const form = document.getElementById('booking-form');
const statusMsg = document.getElementById('status-msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusMsg.style.display = 'none';

  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    property: document.getElementById('property').value,
    preferredDate: document.getElementById('preferredDate').value,
    message: document.getElementById('message').value
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      form.reset();
      statusMsg.style.color = 'var(--sage)';
      statusMsg.textContent = "Request sent. We'll be in touch to confirm a time.";
      statusMsg.style.display = 'block';
    } else {
      statusMsg.style.color = 'var(--rust)';
      statusMsg.textContent = data.error || 'Something went wrong. Please try again.';
      statusMsg.style.display = 'block';
    }
  } catch (err) {
    statusMsg.style.color = 'var(--rust)';
    statusMsg.textContent = 'Could not send your request. Check your connection and try again.';
    statusMsg.style.display = 'block';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Request viewing';
});