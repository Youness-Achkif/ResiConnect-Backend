const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

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

// Routes à brancher au fur et à mesure
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/appartements', require('./routes/appartementRoutes'));
// app.use('/api/paiements', require('./routes/paiementRoutes'));
// app.use('/api/problemes', require('./routes/problemeRoutes'));
// app.use('/api/messages', require('./routes/messageRoutes'));
// app.use('/api/annonces', require('./routes/annonceRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'ResiConnect API is running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
