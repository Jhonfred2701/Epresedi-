/**
 * categoriasController.js
 * ─────────────────────────────────────────────────────────────────
 * Controlador del módulo de Categorías.
 *
 * Maneja las peticiones HTTP y delega la lógica al modelo.
 * Retorna respuestas JSON estandarizadas para el frontend.
 *
 * Endpoints (registrados en categoriasRoutes.js):
 *   GET    /api/categorias          → Listar todas
 *   GET    /api/categorias/:id      → Obtener una por ID
 *   POST   /api/categorias          → Crear nueva
 *   PUT    /api/categorias/:id      → Actualizar existente
 *   DELETE /api/categorias/:id      → Eliminar
 * ─────────────────────────────────────────────────────────────────
 */

const CategoriaModel = require('../models/categoriasModel');

class CategoriasController {

    // ─── Listar todas las categorías ──────────────────────────────────────────
    /**
     * GET /api/categorias
     * Retorna el listado completo ordenado por nombre.
     */
    static async getAll(req, res) {
        try {
            const categorias = await CategoriaModel.getAll();
            res.json(categorias);
        } catch (err) {
            console.error('Error listando categorías:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Obtener una categoría por ID ─────────────────────────────────────────
    /**
     * GET /api/categorias/:id
     */
    static async getById(req, res) {
        try {
            const categoria = await CategoriaModel.getById(req.params.id);
            if (!categoria) {
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json(categoria);
        } catch (err) {
            console.error('Error obteniendo categoría:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Crear nueva categoría ────────────────────────────────────────────────
    /**
     * POST /api/categorias
     * Body: { nombre, descripcion, estado }
     *
     * Retorna 409 si el nombre ya existe (duplicado).
     */
    static async create(req, res) {
        try {
            const nueva = await CategoriaModel.create(req.body);
            res.status(201).json(nueva);
        } catch (err) {
            // Error de duplicado o validación → 409 Conflict
            if (err.message.includes('Ya existe')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error creando categoría:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Actualizar categoría ─────────────────────────────────────────────────
    /**
     * PUT /api/categorias/:id
     * Body: { nombre, descripcion, estado }
     *
     * Retorna 409 si el nombre ya lo tiene otra categoría.
     */
    static async update(req, res) {
        try {
            await CategoriaModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Categoría actualizada correctamente' });
        } catch (err) {
            if (err.message.includes('Ya existe')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error actualizando categoría:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Eliminar categoría ───────────────────────────────────────────────────
    /**
     * DELETE /api/categorias/:id
     */
    static async delete(req, res) {
        try {
            await CategoriaModel.delete(req.params.id);
            res.json({ success: true, message: 'Categoría eliminada correctamente' });
        } catch (err) {
            console.error('Error eliminando categoría:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = CategoriasController;
