(function () {
  const toggle = document.createElement('button');
  toggle.id = 'chatbot-toggle';
  toggle.textContent = '💬';
  toggle.setAttribute('aria-label', 'Open chat assistant');

  const panel = document.createElement('div');
  panel.id = 'chatbot-panel';
  panel.innerHTML = `
    <div class="chatbot-header">Ask us anything</div>
    <div class="chatbot-messages" id="chatbot-messages">
      <div class="chat-msg bot">Hi! Ask me about room availability, your payment status, or file a complaint.</div>
    </div>
    <div class="chatbot-input-row">
      <input type="text" id="chatbot-input" placeholder="Type a message..." />
      <button id="chatbot-send">Send</button>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  toggle.addEventListener('click', () => panel.classList.toggle('open'));

  const messagesEl = document.getElementById('chatbot-messages');
  const inputEl = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    inputEl.value = '';

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      addMessage(data.reply, 'bot');
    } catch (err) {
      addMessage("Something went wrong reaching the assistant. Try again.", 'bot');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();