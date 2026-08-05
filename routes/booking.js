const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();
const BOOKINGS_PATH = path.join(__dirname, '..', 'data', 'bookings.json');
const OWNER_EMAIL = '92sunbirdave@gmail.com';

function loadBookings() {
  return JSON.parse(fs.readFileSync(BOOKINGS_PATH, 'utf-8')).bookings;
}

function saveBookings(bookings) {
  fs.writeFileSync(BOOKINGS_PATH, JSON.stringify({ bookings }, null, 2));
}

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendBookingEmail(booking) {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: 'Email not configured on the server yet' };
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: OWNER_EMAIL,
      subject: 'New viewing request - ' + booking.property,
      text:
        'New physical viewing request from the website:' + '\n\n' +
        'Name: ' + booking.name + '\n' +
        'Email: ' + booking.email + '\n' +
        'Phone: ' + booking.phone + '\n' +
        'Property: ' + booking.property + '\n' +
        'Preferred date/time: ' + booking.preferredDate + '\n' +
        'Message: ' + (booking.message || '(none)')
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

router.post('/', async (req, res) => {
  const { name, email, phone, property, preferredDate, message } = req.body;

  if (!name || !email || !phone || !property || !preferredDate) {
    return res.status(400).json({ error: 'name, email, phone, property, and preferredDate are all required' });
  }

  const bookings = loadBookings();
  const booking = {
    id: 'book-' + Date.now(),
    name,
    email,
    phone,
    property,
    preferredDate,
    message: message || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  saveBookings(bookings);

  const emailResult = await sendBookingEmail(booking);

  res.status(201).json({ ok: true, id: booking.id, emailSent: emailResult.sent });
});

module.exports = router;