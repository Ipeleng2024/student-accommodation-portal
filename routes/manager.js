const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const router = express.Router();
const MANAGERS_PATH = path.join(__dirname, '..', 'data', 'managers.json');
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');

function loadManagers() {
  return JSON.parse(fs.readFileSync(MANAGERS_PATH, 'utf-8')).managers;
}

function loadProperties() {
  return JSON.parse(fs.readFileSync(PROPERTIES_PATH, 'utf-8')).properties;
}

function saveProperties(properties) {
  fs.writeFileSync(PROPERTIES_PATH, JSON.stringify({ properties }, null, 2));
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

module.exports = router;
