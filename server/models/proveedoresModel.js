/**
 * proveedoresModel.js
 * ─────────────────────────────────────────────────────────────────
 * Modelo de datos para la tabla `proveedores`.
 *
 * Campos: id, nombre, contacto, telefono, correo, direccion, fecha_creacion
 * Relación principal: puede asignarse a `productos` (id_proveedor).
 * ─────────────────────────────────────────────────────────────────
 */

const db = require('../db');

class ProveedoresModel {

    // ─── Listar todos los proveedores ─────────────────────────────────────────
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM proveedores ORDER BY nombre ASC'
        );
        return rows;
    }

    // ─── Obtener por ID ───────────────────────────────────────────────────────
    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM proveedores WHERE id = ?', [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // ─── Verificar si existe por correo ────────────────────────────────────────
    /**
     * Busca si ya existe un proveedor con el mismo correo electrónico.
     * Ignora mayúsculas/minúsculas.
     * Puede excluir un ID específico, útil para la acción de UPDATE.
     */
    static async existeCorreo(correo, excluirId = null) {
        if (!correo) return false;
        
        let sql    = 'SELECT id FROM proveedores WHERE LOWER(correo) = LOWER(?)';
        let params = [correo.trim()];

        if (excluirId) {
            sql   += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await db.query(sql, params);
        return rows.length > 0;
    }

    // ─── Crear proveedor ──────────────────────────────────────────────────────
    static async create(data) {
        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre del proveedor es obligatorio');
        }

        // Validación: sin correos duplicados
        if (data.correo) {
            const duplicado = await ProveedoresModel.existeCorreo(data.correo);
            if (duplicado) {
                throw new Error(`Ya existe un proveedor registrado con el correo "${data.correo.trim()}"`);
            }
        }

        // Generar ID único usando el formato de la aplicación PROV-TIMESTAMP
        const id = 'PROV-' + Date.now();

        // Determinar fecha_creacion en Zona Horaria Correcta
        const fecha_creacion = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(new Date()).replace(',', '');

        await db.query(
            `INSERT INTO proveedores (id, nombre, contacto, telefono, correo, direccion, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.nombre.trim(),
                data.contacto ? data.contacto.trim() : '',
                data.telefono ? data.telefono.trim() : '',
                data.correo ? data.correo.trim() : null,
                data.direccion ? data.direccion.trim() : '',
                fecha_creacion
            ]
        );

        return { id, ...data, fecha_creacion };
    }

    // ─── Actualizar proveedor ─────────────────────────────────────────────────
    static async update(id, data) {
        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre del proveedor es obligatorio');
        }

        // Validación: sin correos duplicados de OTRO proveedor
        if (data.correo) {
            const duplicado = await ProveedoresModel.existeCorreo(data.correo, id);
            if (duplicado) {
                throw new Error(`El correo "${data.correo.trim()}" ya está en uso por otro proveedor`);
            }
        }

        await db.query(
            `UPDATE proveedores
             SET nombre = ?, contacto = ?, telefono = ?, correo = ?, direccion = ?
             WHERE id = ?`,
            [
                data.nombre.trim(),
                data.contacto ? data.contacto.trim() : '',
                data.telefono ? data.telefono.trim() : '',
                data.correo ? data.correo.trim() : null,
                data.direccion ? data.direccion.trim() : '',
                id
            ]
        );
    }

    // ─── Eliminar proveedor ───────────────────────────────────────────────────
    static async delete(id) {
        if (id === 'PROV-GEN') {
            throw new Error('No es posible eliminar el Proveedor General del sistema.');
        }
        await db.query('DELETE FROM proveedores WHERE id = ?', [id]);
    }
}

module.exports = ProveedoresModel;
