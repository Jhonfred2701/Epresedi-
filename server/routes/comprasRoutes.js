/**
 * comprasRoutes.js
 * ─────────────────────────────────────────────────────────────────
 * Rutas de la API de Compras.
 * Prefijo: /api/compras
 * ─────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const ComprasController = require('../controllers/comprasController');

router.get('/', ComprasController.getAll);
router.get('/:id', ComprasController.getById);
router.post('/', ComprasController.create);

module.exports = router;
