/**
 * clientesController.js
 * ─────────────────────────────────────────────────────────────────
 * Controlador y gestor de estado HTTP para Clientes.
 * ─────────────────────────────────────────────────────────────────
 */

const ClientesModel = require('../models/clientesModel');

class ClientesController {

    static async getAll(req, res) {
        try {
            const list = await ClientesModel.getAll();
            res.json(list);
        } catch (err) {
            console.error('Error Obteniendo Clientes:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async getById(req, res) {
        try {
            const item = await ClientesModel.getById(req.params.id);
            if (!item) return res.status(404).json({ error: 'Registro de cliente no ubicado en la base de datos.' });
            res.json(item);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async create(req, res) {
        try {
            const resData = await ClientesModel.create(req.body);
            res.status(201).json(resData);
        } catch (err) {
            // Emite código 409 si el modelo tira error de duplicidad
            if (err.message.includes('Ya existe') || err.message.includes('duplicado') || err.message.includes('registrado a nombre')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error insertando cliente:', err);
            res.status(400).json({ error: err.message });
        }
    }

    static async update(req, res) {
        try {
            await ClientesModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Ficha de cliente salvada exitosamente.' });
        } catch (err) {
            if (err.message.includes('adjudicado') || err.message.includes('figura en el sistema')) {
                return res.status(409).json({ error: err.message });
            }
            console.error('Error actualizando cliente:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async delete(req, res) {
        try {
            await ClientesModel.delete(req.params.id);
            res.json({ success: true, message: 'Cliente eliminado definitivamente.' });
        } catch (err) {
            console.error("Error destruyendo registro cliente:", err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = ClientesController;
