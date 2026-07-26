const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const router = express.Router();
const TENANTS_PATH = path.join(__dirname, '..', 'data', 'tenants.json');
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');

function loadTenants() {
  return JSON.parse(fs.readFileSync(TENANTS_PATH, 'utf-8')).tenants;
}

function loadProperties() {
  return JSON.parse(fs.readFileSync(PROPERTIES_PATH, 'utf-8')).properties;
}

function requireTenant(req, res, next) {
  if (req.session && req.session.tenantId) return next();
  return res.status(401).json({ error: 'Not logged in' });
}

// POST /api/tenant/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.email.toLowerCase() === String(email).toLowerCase());

  if (!tenant || !bcrypt.compareSync(password, tenant.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  req.session.tenantId = tenant.id;
  req.session.tenantName = tenant.name;
  res.json({ name: tenant.name, email: tenant.email });
});

// POST /api/tenant/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/tenant/session
router.get('/session', (req, res) => {
  if (req.session && req.session.tenantId) {
    return res.json({ loggedIn: true, name: req.session.tenantName });
  }
  res.json({ loggedIn: false });
});

// GET /api/tenant/me - account statement (protected)
router.get('/me', requireTenant, (req, res) => {
  const tenants = loadTenants();
  const tenant = tenants.find((t) => t.id === req.session.tenantId);
  if (!tenant) return res.status(404).json({ error: 'Account not found' });

  const properties = loadProperties();
  const property = properties.find((p) => p.id === tenant.propertyId);
  const room = property ? property.rooms.find((r) => r.id === tenant.roomId) : null;

  res.json({
    name: tenant.name,
    email: tenant.email,
    accountStatus: tenant.accountStatus,
    balanceDue: tenant.balanceDue,
    note: tenant.note,
    lastUpdated: tenant.lastUpdated,
    property: property ? { id: property.id, name: property.name, area: property.area } : null,
    room: room ? { id: room.id, type: room.type, priceMonthly: room.priceMonthly } : null
  });
});

module.exports = router;