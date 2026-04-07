/**
 * proveedoresRoutes.js
 * ─────────────────────────────────────────────────────────────────
 * Rutas RESTful para el módulo de Proveedores.
 * Prefijo: /api/proveedores (Registrado en server.js)
 * ─────────────────────────────────────────────────────────────────
 */

const express               = require('express');
const router                = express.Router();
const ProveedoresController = require('../controllers/proveedoresController');

router.get('/',    ProveedoresController.getAll);
router.get('/:id', ProveedoresController.getById);
router.post('/',   ProveedoresController.create);
router.put('/:id', ProveedoresController.update);
router.delete('/:id', ProveedoresController.delete);

module.exports = router;
