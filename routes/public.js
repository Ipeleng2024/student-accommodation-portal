const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'data', 'properties.json');

function loadProperties() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw).properties;
}

// GET /api/public/properties - full listing with rooms
router.get('/properties', (req, res) => {
  const properties = loadProperties();
  res.json({ properties });
});

// GET /api/public/summary - counts for the room board (hero)
router.get('/summary', (req, res) => {
  const properties = loadProperties();
  const board = properties.map((p) => ({
    id: p.id,
    name: p.name,
    area: p.area,
    rooms: p.rooms.map((r) => ({ id: r.id, status: r.status, type: r.type }))
  }));

  const totalRooms = properties.reduce((sum, p) => sum + p.rooms.length, 0);
  const availableRooms = properties.reduce(
    (sum, p) => sum + p.rooms.filter((r) => r.status === 'available').length,
    0
  );

  res.json({ totalRooms, availableRooms, board });
});

module.exports = router;