const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/', async (req, res) => {
  const { capteur_id, zone_id, niveau, titre, message, valeur_fumee, valeur_temp } = req.body;
  try {
    await db.query(`
      INSERT INTO alertes (capteur_id, zone_id, niveau, titre, message, valeur_fumee, valeur_temp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [capteur_id, zone_id, niveau, titre, message, valeur_fumee || 0, valeur_temp || 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/non-lues', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, z.nom AS zone_nom
      FROM alertes a
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE a.est_lue = FALSE
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/lue', async (req, res) => {
  try {
    await db.query(
      'UPDATE alertes SET est_lue = TRUE WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;