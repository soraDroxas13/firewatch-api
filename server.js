const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// CORS permissif pour déboguer
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/capteurs',   require('./routes/capteurs'));
app.use('/api/historique', require('./routes/historique'));
app.use('/api/alertes',    require('./routes/alertes'));
app.use('/api/autorites',  require('./routes/autorites'));

app.get('/', (req, res) => {
  res.json({ status: 'FireWatch API en ligne' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FireWatch API démarrée sur http://localhost:${PORT}`);
});