/**
 * proveedoresController.js
 * ─────────────────────────────────────────────────────────────────
 * Controlador del módulo de Proveedores.
 *
 * Endpoints:
 *   GET    /api/proveedores          → Listar todos
 *   GET    /api/proveedores/:id      → Obtener por ID
 *   POST   /api/proveedores          → Crear nuevo
 *   PUT    /api/proveedores/:id      → Actualizar existente
 *   DELETE /api/proveedores/:id      → Eliminar
 * ─────────────────────────────────────────────────────────────────
 */

const ProveedoresModel = require('../models/proveedoresModel');

class ProveedoresController {

    static async getAll(req, res) {
        try {
            const proveedores = await ProveedoresModel.getAll();
            res.json(proveedores);
        } catch (err) {
            console.error('Error listando proveedores:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async getById(req, res) {
        try {
            const proveedor = await ProveedoresModel.getById(req.params.id);
            if (!proveedor) {
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            }
            res.json(proveedor);
        } catch (err) {
            console.error('Error obteniendo proveedor:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async create(req, res) {
        try {
            const nuevo = await ProveedoresModel.create(req.body);
            res.status(201).json(nuevo);
        } catch (err) {
            // Manejo de Error cuando el correo electrónico ya existe (HTTP 409)
            if (err.message.includes('correo') && err.message.includes('existe')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error creando proveedor:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async update(req, res) {
        try {
            await ProveedoresModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Proveedor actualizado correctamente' });
        } catch (err) {
            if (err.message.includes('correo') && err.message.includes('uso')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error actualizando proveedor:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async delete(req, res) {
        try {
            await ProveedoresModel.delete(req.params.id);
            res.json({ success: true, message: 'Proveedor eliminado correctamente' });
        } catch (err) {
            console.error('Error eliminando proveedor:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = ProveedoresController;
