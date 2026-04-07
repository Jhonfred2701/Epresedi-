/**
 * clientesRoutes.js
 * ─────────────────────────────────────────────────────────────────
 * Rutas RESTful de Clientes.
 * Montadas en /api/clientes
 * ─────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const ClientesController = require('../controllers/clientesController');

router.get('/', ClientesController.getAll);
router.get('/:id', ClientesController.getById);
router.post('/', ClientesController.create);
router.put('/:id', ClientesController.update);
router.delete('/:id', ClientesController.delete);

module.exports = router;
