const express = require('express');
const fs = require('fs');
const path = require('path');
const { bookingLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const BOOKINGS_PATH = path.join(__dirname, '..', 'data', 'bookings.json');
const PROPERTIES_PATH = path.join(__dirname, '..', 'data', 'properties.json');
const OWNER_EMAIL = '92sunbirdave@gmail.com';
const DEFAULT_FROM = 'Sunbird Berg Website <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadBookings() {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf-8')).bookings || [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveBookings(bookings) {
  fs.writeFileSync(BOOKINGS_PATH, JSON.stringify({ bookings }, null, 2));
}

function loadProperties() {
  return JSON.parse(fs.readFileSync(PROPERTIES_PATH, 'utf-8')).properties;
}

function clean(value, max) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

function buildEmail(booking) {
  const lines = [];

  if (booking.kind === 'room') {
    lines.push('New 2027 room booking request from the website:', '');
    lines.push('Property: ' + booking.property);
    lines.push('Room type: ' + booking.roomType + ' (R' + booking.priceMonthly + ' / month)');
  } else {
    lines.push('New physical viewing request from the website:', '');
    lines.push('Property: ' + booking.property);
    lines.push('Preferred date/time: ' + booking.preferredDate);
  }

  lines.push('Name: ' + booking.name);
  lines.push('Email: ' + booking.email);
  lines.push('Phone: ' + booking.phone);
  lines.push('Message: ' + (booking.message || '(none)'));

  const subject =
    booking.kind === 'room'
      ? 'New 2027 booking request - ' + booking.property + ' - ' + booking.roomType
      : 'New viewing request - ' + booking.property;

  return { subject, text: lines.join('\n') };
}

async function sendBookingEmail(booking) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Booking email skipped: RESEND_API_KEY is not set');
    return { sent: false, reason: 'Email not configured on the server yet' };
  }

  try {
    const { subject, text } = buildEmail(booking);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [OWNER_EMAIL],
        reply_to: booking.email,
        subject,
        text
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('Booking email failed (' + response.status + '): ' + detail);
      return { sent: false, reason: 'Email service rejected the message' };
    }

    console.log('Booking email sent: ' + subject);
    return { sent: true };
  } catch (err) {
    console.error('Booking email failed: ' + err.message);
    return { sent: false, reason: err.message };
  }
}

// POST /api/booking
// kind "room"    : 2027 room booking request (property + room type chosen on the site)
// kind "viewing" : physical viewing request (default, used by book-viewing.html)
router.post('/', bookingLimiter, async (req, res) => {
  const body = req.body || {};
  const kind = body.kind === 'room' ? 'room' : 'viewing';

  const name = clean(body.name, 100);
  const email = clean(body.email, 120);
  const phone = clean(body.phone, 30);
  const message = clean(body.message, 1500);

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  let booking;

  if (kind === 'room') {
    const property = loadProperties().find((p) => p.id === body.propertyId);
    if (!property) {
      return res.status(400).json({ error: 'Unknown property' });
    }

    const roomType = (property.roomTypes || []).find((t) => t.id === body.roomTypeId);
    if (!roomType) {
      return res.status(400).json({ error: 'Please choose a room type' });
    }

    // Price and names come from our own data, never from the browser
    booking = {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind: 'room',
      name,
      email,
      phone,
      property: property.name,
      roomType: roomType.name,
      priceMonthly: roomType.priceMonthly,
      year: 2027,
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
  } else {
    const property = clean(body.property, 60);
    const preferredDate = clean(body.preferredDate, 100);

    if (!property || !preferredDate) {
      return res.status(400).json({ error: 'Property and preferred date are required for a viewing request' });
    }

    booking = {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind: 'viewing',
      name,
      email,
      phone,
      property,
      preferredDate,
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
  }

  const bookings = loadBookings();
  bookings.push(booking);
  saveBookings(bookings);

  const emailResult = await sendBookingEmail(booking);

  res.status(201).json({ ok: true, id: booking.id, emailSent: emailResult.sent });
});

module.exports = router;
