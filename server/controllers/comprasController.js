/**
 * comprasController.js
 * ─────────────────────────────────────────────────────────────────
 * Enlace HTTP para el módulo de compras.
 * ─────────────────────────────────────────────────────────────────
 */

const ComprasModel = require('../models/comprasModel');

class ComprasController {

    static async getAll(req, res) {
        try {
            const list = await ComprasModel.getAll();
            res.json(list);
        } catch (err) {
            console.error('Error listando compras:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async getById(req, res) {
        try {
            const data = await ComprasModel.getById(req.params.id);
            if (!data) return res.status(404).json({ error: 'Compra no encontrada' });
            res.json(data);
        } catch (err) {
            console.error('Error buscando detalle de compra:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async create(req, res) {
        try {
            const resData = await ComprasModel.create(req.body);
            res.status(201).json(resData);
        } catch (err) {
            console.error('Error insertando compra:', err);
            res.status(400).json({ error: err.message });
        }
    }

}

module.exports = ComprasController;
