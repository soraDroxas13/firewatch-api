const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, z.nom AS zone_nom
      FROM capteurs c
      JOIN zones z ON c.zone_id = z.id
    `);
    res.json(rows);
  } catch (err) {
  
    console.error('ERREUR CONNEXION CAPTEUR :');
    console.error(err);
  
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/update', async (req, res) => {
  const { identifiant, valeur_fumee, valeur_temp, valeur_hum } = req.body;
  try {
    await db.query(`
      UPDATE capteurs
      SET derniere_valeur_fumee = $1,
          derniere_valeur_temp  = $2,
          derniere_valeur_hum   = $3,
          derniere_maj          = NOW()
      WHERE identifiant = $4
    `, [valeur_fumee || 0, valeur_temp || 0, valeur_hum || 0, identifiant]);
    res.json({ success: true });
  } catch (err) {
  
    console.error('ERREUR CONNEXION CAPTEUR :');
    console.error(err);
  
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/enregistrer', async (req, res) => {
  const { identifiant, nom_lieu, quartier } = req.body;
  if (!identifiant || !nom_lieu || !quartier) {
    return res.status(400).json({ error: 'Identifiant, nom du lieu et quartier sont requis.' });
  }
  try {
    // 1. Créer ou récupérer la zone
    const { rows: zones } = await db.query(
      'SELECT * FROM zones WHERE nom = $1 AND description = $2',
      [nom_lieu, quartier]
    );

    let zone_id;
    if (zones.length > 0) {
      zone_id = zones[0].id;
    } else {
      const { rows: newZone } = await db.query(
        'INSERT INTO zones (nom, description) VALUES ($1, $2) RETURNING id',
        [nom_lieu, quartier]
      );
      zone_id = newZone[0].id;
    }

    // 2. Vérifier si le capteur existe déjà
    const { rows: existants } = await db.query(
      'SELECT * FROM capteurs WHERE identifiant = $1',
      [identifiant.toUpperCase()]
    );

    let capteur_id;
    if (existants.length > 0) {
      await db.query(
        'UPDATE capteurs SET zone_id = $1, est_actif = TRUE WHERE identifiant = $2',
        [zone_id, identifiant.toUpperCase()]
      );
      capteur_id = existants[0].id;
    } else {
      const { rows: newCap } = await db.query(
        `INSERT INTO capteurs (zone_id, identifiant, type_capteur, topic_mqtt)
         VALUES ($1, $2, 'mq2', $3) RETURNING id`,
        [zone_id, identifiant.toUpperCase(), `home/${identifiant.toLowerCase()}`]
      );
      capteur_id = newCap[0].id;
    }

    res.json({ success: true, capteur_id, zone_id, zone_nom: nom_lieu });
  } catch (err) {
  
    console.error('ERREUR CONNEXION CAPTEUR :');
    console.error(err);
  
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/connexion', async (req, res) => {
  const { identifiant } = req.body;
  if (!identifiant) {
    return res.status(400).json({ error: 'Identifiant capteur requis.' });
  }
  try {
    const { rows } = await db.query(`
      SELECT c.*, z.nom AS zone_nom, z.description AS zone_quartier
      FROM capteurs c
      JOIN zones z ON c.zone_id = z.id
      WHERE c.identifiant = $1
    `, [identifiant.toUpperCase()]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Capteur introuvable.' });
    }
    const c = rows[0];
    res.json({
      success: true, capteur_id: c.id,
      identifiant: c.identifiant, zone_id: c.zone_id,
      zone_nom: c.zone_nom, zone_quartier: c.zone_quartier,
      type_capteur: c.type_capteur, est_actif: c.est_actif
    });
  } catch (err) {
  
    console.error('ERREUR CONNEXION CAPTEUR :');
    console.error(err);
  
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;