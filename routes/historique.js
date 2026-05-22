const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/', async (req, res) => {
  const { capteur_id, valeur_fumee, valeur_temp, valeur_hum } = req.body;
  try {
    await db.query(
      `INSERT INTO historique_capteurs (capteur_id, valeur_fumee, valeur_temp, valeur_hum)
       VALUES ($1, $2, $3, $4)`,
      [capteur_id, valeur_fumee || 0, valeur_temp || 0, valeur_hum || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:capteur_id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM historique_capteurs
       WHERE capteur_id = $1
       ORDER BY recorded_at DESC
       LIMIT 100`,
      [req.params.capteur_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;