const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');
const TENANTS_PATH = path.join(__dirname, '..', 'data', 'tenants.json');
const COMPLAINTS_PATH = path.join(__dirname, '..', 'data', 'complaints.json');

const CONTACT_LINE = 'You can reach us on 061 530 7428 or email 92sunbirdave@gmail.com.';

// On the live website the tenant portal is not available yet, so account and complaint
// questions are sent to the office instead. Locally (no NODE_ENV) they still work for testing.
function isLive() {
  return process.env.NODE_ENV === 'production';
}

function readList(filePath, key) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))[key] || [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function loadProperties() { return readList(PROPERTIES_PATH, 'properties'); }
function loadTenants() { return readList(TENANTS_PATH, 'tenants'); }
function loadComplaints() { return readList(COMPLAINTS_PATH, 'complaints'); }
function saveComplaints(complaints) {
  fs.writeFileSync(COMPLAINTS_PATH, JSON.stringify({ complaints }, null, 2));
}

// Same format as the website (R5,300), whatever language settings the server has
function money(n) {
  return 'R' + String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// A trigger matches when a word STARTS with it ("pay" matches "payment", but "rent" no longer matches "different")
function matches(message, triggers) {
  const lower = message.toLowerCase();
  return triggers.some((t) => new RegExp('\\b' + t).test(lower));
}

// Short words such as "hi" must match as whole words ("hi" no longer matches "which")
function matchesWord(message, words) {
  const lower = message.toLowerCase();
  return words.some((w) => new RegExp('\\b' + w + '\\b').test(lower));
}

function handleRoomsQuery() {
  const properties = loadProperties();
  const blocks = properties.map((p) => {
    const types = p.roomTypes || [];
    if (types.length === 0) {
      return p.name + '\nPrices coming soon, please contact us.';
    }
    const list = types.map((t) => t.name + ': ' + money(t.priceMonthly) + ' / month').join('\n');
    return p.name + '\n' + list;
  });
  return '2027 room options:\n\n' + blocks.join('\n\n') +
    '\n\nTo book, use the "Book for 2027" buttons on the homepage.\n\n' + CONTACT_LINE;
}

function handleLocationQuery() {
  return 'Sunbird House: 92 Sunbird Avenue, Ninapark, Akasia. It is 600m from Belgium Campus iTversity.\n' +
    'Berg House: 1211 Berg Avenue, Ninapark, Akasia.\n\n' + CONTACT_LINE;
}

function handlePaymentQuery(session) {
  if (isLive()) {
    return 'For questions about your account or payments, please contact us directly. ' + CONTACT_LINE;
  }
  if (!session || !session.tenantId) {
    return 'I can only pull up account status for logged-in tenants. If you are a student here, log into the Tenant Portal first, then ask me again.';
  }
  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.id === session.tenantId);
  if (!tenant) return 'I could not find your account. Please contact management directly.';

  if (tenant.accountStatus === 'up_to_date') {
    return 'Good news - your account is up to date as of ' + tenant.lastUpdated + '. No outstanding balance.';
  }
  return 'Your account shows ' + money(tenant.balanceDue) + ' outstanding as of ' + tenant.lastUpdated +
    '. If you have already paid, let management know so they can update it - this is checked manually, not automatically.';
}

function fileComplaint(session, description) {
  const complaints = loadComplaints();
  const tenants = loadTenants();
  const tenant = session && session.tenantId ? tenants.find((t) => t.id === session.tenantId) : null;

  const complaint = {
    id: 'cmp-' + Date.now(),
    tenantId: tenant ? tenant.id : null,
    tenantName: tenant ? tenant.name : 'Public inquiry (not logged in)',
    message: description,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  complaints.push(complaint);
  saveComplaints(complaints);
  return 'Got it - I have logged this for management: "' + description + '". They will follow up. Reference: ' + complaint.id;
}

const FALLBACK =
  'I can help with room types and prices, where we are, and how to book. For anything else, ' +
  CONTACT_LINE.charAt(0).toLowerCase() + CONTACT_LINE.slice(1);

router.post('/message', (req, res) => {
  const message = (req.body && req.body.message) || '';
  if (!message.trim()) {
    return res.json({ reply: FALLBACK });
  }

  // Multi-turn (local testing only): the previous message asked for the issue description
  if (req.session.awaitingComplaintDescription) {
    req.session.awaitingComplaintDescription = false;
    return res.json({ reply: fileComplaint(req.session, message.trim()) });
  }

  if (matches(message, ['complaint', 'issue', 'problem', 'broken', 'fix', 'maintenance', 'leak', 'noise', 'faulty', 'not working'])) {
    if (isLive()) {
      return res.json({
        reply: 'Sorry to hear that. To report an issue or make a complaint, please contact us directly. ' + CONTACT_LINE
      });
    }
    req.session.awaitingComplaintDescription = true;
    return res.json({ reply: 'Sorry to hear that. Please describe the issue in one message and I will log it for management.' });
  }

  if (matches(message, ['balance', 'owe', 'owing', 'statement', 'arrears', 'paid', 'account'])) {
    return res.json({ reply: handlePaymentQuery(req.session) });
  }

  if (matches(message, ['room', 'available', 'vacan', 'space', 'book', 'viewing', 'price', 'cost', 'how much', 'rate', 'rent', 'pay', 'fee', 'cheap', 'sharing', 'single', 'ensuite', 'apply', '2027'])) {
    return res.json({ reply: handleRoomsQuery() });
  }

  if (matches(message, ['address', 'where', 'location', 'directions', 'campus', 'distance', 'walk', 'close to'])) {
    return res.json({ reply: handleLocationQuery() });
  }

  if (matches(message, ['human', 'agent', 'manager', 'speak', 'talk', 'call', 'phone', 'number', 'contact', 'email', 'whatsapp'])) {
    return res.json({ reply: CONTACT_LINE });
  }

  if (matches(message, ['thanks', 'thank you', 'bye', 'cheers', 'appreciate'])) {
    return res.json({ reply: 'Anytime! Reach out again if you need anything else.' });
  }

  if (matchesWord(message, ['hi', 'hello', 'hey', 'howzit', 'sup']) || matches(message, ['good morning', 'good afternoon', 'good evening'])) {
    return res.json({ reply: 'Hi! I can help with room types and prices, where we are, and how to book. What would you like to know?' });
  }

  return res.json({ reply: FALLBACK });
});

module.exports = router;