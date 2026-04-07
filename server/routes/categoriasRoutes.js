/**
 * categoriasRoutes.js
 * ─────────────────────────────────────────────────────────────────
 * Define las rutas RESTful para el módulo de Categorías.
 *
 * Prefijo base (registrado en server.js): /api/categorias
 *
 * Rutas:
 *   GET    /           → Listar todas las categorías
 *   GET    /:id        → Obtener una categoría por ID
 *   POST   /           → Crear nueva categoría
 *   PUT    /:id        → Actualizar categoría existente
 *   DELETE /:id        → Eliminar categoría
 * ─────────────────────────────────────────────────────────────────
 */

const express               = require('express');
const router                = express.Router();
const CategoriasController  = require('../controllers/categoriasController');

// Listar todas las categorías
router.get('/',    CategoriasController.getAll);

// Obtener una categoría por ID
router.get('/:id', CategoriasController.getById);

// Crear nueva categoría
router.post('/',   CategoriasController.create);

// Actualizar categoría
router.put('/:id', CategoriasController.update);

// Eliminar categoría
router.delete('/:id', CategoriasController.delete);

module.exports = router;
