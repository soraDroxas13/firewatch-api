const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/capteurs',    require('./routes/capteurs'));
app.use('/api/historique',  require('./routes/historique'));
app.use('/api/alertes',     require('./routes/alertes'));
app.use('/api/autorites', require('./routes/autorites'));

// Test de vie
app.get('/', (req, res) => {
  res.json({ status: 'FireWatch API en ligne' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FireWatch API démarrée sur http://localhost:${PORT}`);
});