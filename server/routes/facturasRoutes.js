/**
 * facturasRoutes.js
 * ─────────────────────────────────────────────────────────────────
 * Define todas las rutas del módulo de Facturas y las conecta con
 * el controlador correspondiente.
 *
 * Prefijo base (registrado en server.js): /api/facturas
 *
 * Rutas disponibles:
 *   GET  /                  → Listar todas las facturas
 *   GET  /preview-numero    → Previsualizar próximo número por tipo de documento
 *   POST /                  → Crear nueva factura (número se genera automáticamente)
 *   DELETE /:id             → Eliminar una factura
 *   GET  /:id/pdf           → Redirigir (PDF en frontend)
 *   POST /:id/email         → Enviar factura por correo
 *
 * IMPORTANTE: La ruta /preview-numero debe ir ANTES de /:id para que
 * Express no interprete 'preview-numero' como un parámetro :id.
 * ─────────────────────────────────────────────────────────────────
 */

const express            = require('express');
const router             = express.Router();
const FacturasController = require('../controllers/facturasController');

// ─── Rutas CRUD principales ───────────────────────────────────────────────────

// Listar todas las facturas
router.get('/', FacturasController.getAll);

// Previsualizar el próximo número de factura (sin guardar)
// Debe estar ANTES de /:id para evitar conflicto de parámetros
// Ejemplo: GET /api/facturas/preview-numero?tipo=Canon+de+Arrendamiento
router.get('/preview-numero', FacturasController.previewNumero);

// Crear nueva factura (el número se genera automáticamente en el modelo)
router.post('/', FacturasController.create);

// Eliminar factura por ID
router.delete('/:id', FacturasController.delete);

// ─── Rutas de PDF y Correo ────────────────────────────────────────────────────

// Descarga de PDF (generado en frontend con html2pdf.js)
router.get('/:id/pdf', FacturasController.downloadPDF);

// Enviar factura por correo electrónico
router.post('/:id/email', FacturasController.sendEmail);

module.exports = router;
