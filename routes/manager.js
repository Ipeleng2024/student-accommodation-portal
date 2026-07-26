const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const router = express.Router();
const MANAGERS_PATH = path.join(__dirname, '..', 'data', 'managers.json');
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');
const TENANTS_PATH = path.join(__dirname, '..', 'data', 'tenants.json');

function loadManagers() {
  return JSON.parse(fs.readFileSync(MANAGERS_PATH, 'utf-8')).managers;
}

function loadProperties() {
  return JSON.parse(fs.readFileSync(PROPERTIES_PATH, 'utf-8')).properties;
}

function saveProperties(properties) {
  fs.writeFileSync(PROPERTIES_PATH, JSON.stringify({ properties }, null, 2));
}

function loadTenants() {
  return JSON.parse(fs.readFileSync(TENANTS_PATH, 'utf-8')).tenants;
}

function saveTenants(tenants) {
  fs.writeFileSync(TENANTS_PATH, JSON.stringify({ tenants }, null, 2));
}

// Middleware: block anything below this unless logged in as manager
function requireManager(req, res, next) {
  if (req.session && req.session.managerId) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

// POST /api/manager/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const managers = loadManagers();
  const manager = managers.find((m) => m.email.toLowerCase() === String(email).toLowerCase());

  if (!manager || !bcrypt.compareSync(password, manager.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  req.session.managerId = manager.id;
  req.session.managerName = manager.name;
  res.json({ name: manager.name, email: manager.email });
});

// POST /api/manager/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/manager/session - check if logged in (used by dashboard page on load)
router.get('/session', (req, res) => {
  if (req.session && req.session.managerId) {
    return res.json({ loggedIn: true, name: req.session.managerName });
  }
  res.json({ loggedIn: false });
});

// GET /api/manager/dashboard - occupancy analytics (protected)
router.get('/dashboard', requireManager, (req, res) => {
  const properties = loadProperties();

  const propertyStats = properties.map((p) => {
    const total = p.rooms.length;
    const occupied = p.rooms.filter((r) => r.status === 'occupied').length;
    const available = total - occupied;
    const monthlyRevenue = p.rooms
      .filter((r) => r.status === 'occupied')
      .reduce((sum, r) => sum + r.priceMonthly, 0);
    const potentialRevenue = p.rooms.reduce((sum, r) => sum + r.priceMonthly, 0);

    return {
      id: p.id,
      name: p.name,
      area: p.area,
      total,
      occupied,
      available,
      occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
      monthlyRevenue,
      potentialRevenue,
      rooms: p.rooms
    };
  });

  const totals = propertyStats.reduce(
    (acc, p) => {
      acc.total += p.total;
      acc.occupied += p.occupied;
      acc.monthlyRevenue += p.monthlyRevenue;
      acc.potentialRevenue += p.potentialRevenue;
      return acc;
    },
    { total: 0, occupied: 0, monthlyRevenue: 0, potentialRevenue: 0 }
  );
  totals.occupancyRate = totals.total ? Math.round((totals.occupied / totals.total) * 100) : 0;

  res.json({ totals, properties: propertyStats });
});

// PATCH /api/manager/rooms/:propertyId/:roomId - manually toggle room status (protected)
router.patch('/rooms/:propertyId/:roomId', requireManager, (req, res) => {
  const { propertyId, roomId } = req.params;
  const { status } = req.body;

  if (!['available', 'occupied'].includes(status)) {
    return res.status(400).json({ error: 'status must be "available" or "occupied"' });
  }

  const properties = loadProperties();
  const property = properties.find((p) => p.id === propertyId);
  if (!property) return res.status(404).json({ error: 'Property not found' });

  const room = property.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  room.status = status;
  saveProperties(properties);

  res.json({ ok: true, room });
});

// GET /api/manager/tenants - list all tenants with room/property joined (protected)
router.get('/tenants', requireManager, (req, res) => {
  const tenants = loadTenants();
  const properties = loadProperties();

  const enriched = tenants.map((t) => {
    const property = properties.find((p) => p.id === t.propertyId);
    const room = property ? property.rooms.find((r) => r.id === t.roomId) : null;
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      accountStatus: t.accountStatus,
      balanceDue: t.balanceDue,
      note: t.note,
      lastUpdated: t.lastUpdated,
      propertyId: t.propertyId,
      roomId: t.roomId,
      propertyName: property ? property.name : 'Unknown',
      roomPrice: room ? room.priceMonthly : null
    };
  });

  res.json({ tenants: enriched });
});

// POST /api/manager/tenants - create a tenant account (protected)
router.post('/tenants', requireManager, (req, res) => {
  const { name, email, password, propertyId, roomId } = req.body;

  if (!name || !email || !password || !propertyId || !roomId) {
    return res.status(400).json({ error: 'name, email, password, propertyId, and roomId are all required' });
  }

  const tenants = loadTenants();
  if (tenants.some((t) => t.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ error: 'A tenant with that email already exists' });
  }

  const properties = loadProperties();
  const property = properties.find((p) => p.id === propertyId);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  const room = property.rooms.find((r) => r.id === roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const newTenant = {
    id: `ten-${Date.now()}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    propertyId,
    roomId,
    accountStatus: 'up_to_date',
    balanceDue: 0,
    note: '',
    lastUpdated: new Date().toISOString().slice(0, 10)
  };

  tenants.push(newTenant);
  saveTenants(tenants);

  // Room now has a tenant, mark it occupied if it wasn't already
  if (room.status !== 'occupied') {
    room.status = 'occupied';
    saveProperties(properties);
  }

  res.status(201).json({ ok: true, id: newTenant.id });
});

// PATCH /api/manager/tenants/:id - update account status / balance / note (protected)
router.patch('/tenants/:id', requireManager, (req, res) => {
  const { accountStatus, balanceDue, note } = req.body;

  if (accountStatus && !['up_to_date', 'behind'].includes(accountStatus)) {
    return res.status(400).json({ error: 'accountStatus must be "up_to_date" or "behind"' });
  }

  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  if (accountStatus !== undefined) tenant.accountStatus = accountStatus;
  if (balanceDue !== undefined) tenant.balanceDue = balanceDue;
  if (note !== undefined) tenant.note = note;
  tenant.lastUpdated = new Date().toISOString().slice(0, 10);

  saveTenants(tenants);
  res.json({ ok: true, tenant });
});

// DELETE /api/manager/tenants/:id - remove a tenant account (protected)
router.delete('/tenants/:id', requireManager, (req, res) => {
  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const remaining = tenants.filter((t) => t.id !== req.params.id);
  saveTenants(remaining);
  res.json({ ok: true });
});

function loadComplaints() {
  const p = path.join(__dirname, '..', 'data', 'complaints.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8')).complaints;
}

function saveComplaints(complaints) {
  const p = path.join(__dirname, '..', 'data', 'complaints.json');
  fs.writeFileSync(p, JSON.stringify({ complaints }, null, 2));
}

// GET /api/manager/complaints (protected)
router.get('/complaints', requireManager, (req, res) => {
  const complaints = loadComplaints().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ complaints });
});

// PATCH /api/manager/complaints/:id (protected) - mark resolved/open
router.patch('/complaints/:id', requireManager, (req, res) => {
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status must be "open" or "resolved"' });
  }
  const complaints = loadComplaints();
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  complaint.status = status;
  saveComplaints(complaints);
  res.json({ ok: true, complaint });
});

module.exports = router;