const express = require('express');
const path = require('path');
const session = require('express-session');
const publicRoutes = require('./routes/public');
const managerRoutes = require('./routes/manager');
const tenantRoutes = require('./routes/tenant');
const chatbotRoutes = require('./routes/chatbot');
const bookingRoutes = require('./routes/booking');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: 'change-this-secret-before-deploying-anywhere-public',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

app.use('/api/public', publicRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/booking', bookingRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('Student accommodation portal running at http://localhost:' + PORT);
});