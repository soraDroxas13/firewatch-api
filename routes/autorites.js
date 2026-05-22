const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/connexion', async (req, res) => {
  const { organisme, code_acces } = req.body;
  if (!organisme || !code_acces) {
    return res.status(400).json({ error: 'Organisme et code d\'accès requis.' });
  }
  try {
    const { rows } = await db.query(
      'SELECT * FROM autorites WHERE organisme = $1 AND code_acces = $2 AND est_actif = TRUE',
      [organisme, code_acces]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Code d\'accès incorrect.' });
    }
    res.json({ success: true, autorite: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/zones', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT z.id, z.nom, z.description,
             c.id AS capteur_id, c.identifiant, c.type_capteur,
             c.derniere_valeur_fumee, c.derniere_valeur_temp,
             c.derniere_valeur_hum, c.derniere_maj, c.est_actif
      FROM zones z
      LEFT JOIN capteurs c ON c.zone_id = z.id
      ORDER BY z.id, c.id
    `);

    const zonesMap = {};
    rows.forEach((row) => {
      if (!zonesMap[row.id]) {
        zonesMap[row.id] = {
          id: row.id, nom: row.nom, quartier: row.description,
          capteurs: [], fumee: 0, temperature: 0, humidite: 0,
          statut: 'normal', derniereMaj: '--:--', enLigne: false
        };
      }
      if (row.capteur_id) {
        zonesMap[row.id].capteurs.push(row.identifiant);
        zonesMap[row.id].fumee       = Math.max(zonesMap[row.id].fumee, row.derniere_valeur_fumee || 0);
        zonesMap[row.id].temperature = Math.max(zonesMap[row.id].temperature, row.derniere_valeur_temp || 0);
        zonesMap[row.id].humidite    = Math.max(zonesMap[row.id].humidite, row.derniere_valeur_hum || 0);
        zonesMap[row.id].enLigne     = row.est_actif;
        zonesMap[row.id].derniereMaj = row.derniere_maj
          ? new Date(row.derniere_maj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '--:--';
        const f = row.derniere_valeur_fumee || 0;
        const t = row.derniere_valeur_temp  || 0;
        zonesMap[row.id].statut = f > 300 || t > 55 ? 'critique' : f > 200 || t > 40 ? 'alerte' : 'normal';
      }
    });
    res.json(Object.values(zonesMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alertes', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, z.nom AS zone_nom
      FROM alertes a
      LEFT JOIN zones z ON a.zone_id = z.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/statistiques', async (req, res) => {
  try {
    const { rows: r1 } = await db.query('SELECT COUNT(*) AS total FROM zones');
    const { rows: r2 } = await db.query('SELECT COUNT(*) AS total FROM capteurs WHERE est_actif = TRUE');
    const { rows: r3 } = await db.query('SELECT COUNT(*) AS total FROM alertes WHERE est_lue = FALSE');
    const { rows: r4 } = await db.query('SELECT COUNT(*) AS total FROM alertes WHERE niveau = $1 AND est_lue = FALSE', ['critique']);

    res.json({
      total_zones:    r1[0].total,
      total_capteurs: r2[0].total,
      total_alertes:  r3[0].total,
      alertes_crit:   r4[0].total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;