const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');
const TENANTS_PATH = path.join(__dirname, '..', 'data', 'tenants.json');
const COMPLAINTS_PATH = path.join(__dirname, '..', 'data', 'complaints.json');

function loadProperties() {
  return JSON.parse(fs.readFileSync(PROPERTIES_PATH, 'utf-8')).properties;
}
function loadTenants() {
  return JSON.parse(fs.readFileSync(TENANTS_PATH, 'utf-8')).tenants;
}
function loadComplaints() {
  return JSON.parse(fs.readFileSync(COMPLAINTS_PATH, 'utf-8')).complaints;
}
function saveComplaints(complaints) {
  fs.writeFileSync(COMPLAINTS_PATH, JSON.stringify({ complaints }, null, 2));
}

function money(n) {
  return `R${n.toLocaleString()}`;
}

// Matches a message against a list of trigger words (case-insensitive, substring match)
function matches(message, triggers) {
  const lower = message.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}

function handleRoomsQuery() {
  const properties = loadProperties();
  const lines = properties.map((p) => {
    const open = p.rooms.filter((r) => r.status === 'available');
    if (open.length === 0) return `${p.name}: fully booked right now.`;
    const roomList = open.map((r) => `${r.id} (${r.type}, ${money(r.priceMonthly)}/mo)`).join(', ');
    return `${p.name}: ${open.length} open — ${roomList}`;
  });
  return `Here's what's open right now:\n${lines.join('\n')}\n\nWant to view the full listings? Head to the Properties section on the homepage.`;
}

function handlePaymentQuery(session) {
  if (!session || !session.tenantId) {
    return "I can only pull up account status for logged-in tenants. If you're a student here, log into the Tenant Portal first, then ask me again.";
  }
  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.id === session.tenantId);
  if (!tenant) return "I couldn't find your account. Please contact management directly.";

  if (tenant.accountStatus === 'up_to_date') {
    return `Good news — your account is up to date as of ${tenant.lastUpdated}. No outstanding balance.`;
  }
  return `Your account shows ${money(tenant.balanceDue)} outstanding as of ${tenant.lastUpdated}. If you've already paid, let management know so they can update it — this is checked manually, not automatically.`;
}

function fileComplaint(session, description) {
  const complaints = loadComplaints();
  const tenants = loadTenants();
  const tenant = session && session.tenantId ? tenants.find((t) => t.id === session.tenantId) : null;

  const complaint = {
    id: `cmp-${Date.now()}`,
    tenantId: tenant ? tenant.id : null,
    tenantName: tenant ? tenant.name : 'Public inquiry (not logged in)',
    message: description,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  complaints.push(complaint);
  saveComplaints(complaints);
  return `Got it — I've logged this for management: "${description}". They'll follow up. Reference: ${complaint.id}`;
}

const FALLBACK =
  "I can help with a few things: room availability, your payment status (if you're logged in as a tenant), or filing a complaint/maintenance request. What do you need?";

// POST /api/chatbot/message
router.post('/message', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.json({ reply: FALLBACK });
  }

  // Multi-turn: if we previously asked the user to describe their issue, this message IS the description
  if (req.session.awaitingComplaintDescription) {
    req.session.awaitingComplaintDescription = false;
    return res.json({ reply: fileComplaint(req.session, message.trim()) });
  }

  if (matches(message, ['hi', 'hello', 'hey', 'howzit', 'sup'])) {
    return res.json({
      reply: "Hi! I can help with room availability, your payment status, or filing a complaint. What do you need?"
    });
  }

  if (matches(message, ['complaint', 'issue', 'problem', 'broken', 'fix', 'maintenance', 'leak', 'noise'])) {
    req.session.awaitingComplaintDescription = true;
    return res.json({ reply: 'Sorry to hear that. Please describe the issue in one message and I\'ll log it for management.' });
  }

  if (matches(message, ['pay', 'payment', 'rent', 'balance', 'owe', 'statement', 'account'])) {
    return res.json({ reply: handlePaymentQuery(req.session) });
  }

  if (matches(message, ['room', 'available', 'vacan', 'space', 'book', 'viewing'])) {
    return res.json({ reply: handleRoomsQuery() });
  }

  if (matches(message, ['human', 'agent', 'manager', 'speak to someone', 'call'])) {
    return res.json({
      reply: "For anything I can't handle, contact the office directly — add your real contact number/email in routes/chatbot.js so I can share it here."
    });
  }

  if (matches(message, ['thanks', 'thank you', 'bye', 'cheers'])) {
    return res.json({ reply: "Anytime! Reach out again if you need anything else." });
  }

  return res.json({ reply: FALLBACK });
});

module.exports = router;