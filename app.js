const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const residentRoutes = require('./routes/residentRoutes');
const appartementRoutes = require('./routes/appartementRoutes');
const problemeRoutes = require('./routes/problemeRoutes');
const messageRoutes = require('./routes/messageRoutes');
const annonceRoutes = require('./routes/annonceRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://resiconnect.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (ex: Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin non autorisée — ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/appartements', appartementRoutes);
app.use('/api/problemes', problemeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/annonces', annonceRoutes);

// Routes à brancher au fur et à mesure
// app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'ResiConnect API is running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
