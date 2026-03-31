const express = require('express');
const router = express.Router();
const FacturasController = require('../controllers/facturasController');

// Logica tradicional (CRUD)
router.get('/', FacturasController.getAll);
router.post('/', FacturasController.create);
router.delete('/:id', FacturasController.delete);

// Nuevos endpoints PDF y Correo
router.get('/:id/pdf', FacturasController.downloadPDF);
router.post('/:id/email', FacturasController.sendEmail);

module.exports = router;
