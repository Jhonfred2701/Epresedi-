/**
 * comprasModel.js
 * ─────────────────────────────────────────────────────────────────
 * Modelo responsable del módulo de compras.
 * Controla la inserción en `compras`, iteración sobre `detalle_compra`
 * y la actualización automática e integral del Stock de los `productos`.
 * ─────────────────────────────────────────────────────────────────
 */

const db = require('../db');

class ComprasModel {

    // ─── Obtener todo el Historial de Compras ────────────────────────────────
    static async getAll() {
        const sql = `
            SELECT c.*, p.nombre AS proveedor_nombre 
            FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id
            ORDER BY c.fecha_compra DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

    // ─── Obtener el Detalle Específico de una Compra ────────────────────────
    static async getById(id) {
        // Cabecera
        const sqlCompra = `
            SELECT c.*, p.nombre AS proveedor_nombre, p.correo, p.telefono
            FROM compras c
            LEFT JOIN proveedores p ON c.id_proveedor = p.id
            WHERE c.id = ?
        `;
        const [cabecera] = await db.query(sqlCompra, [id]);
        if (!cabecera || cabecera.length === 0) return null;

        // Ítems Detallados
        const sqlDetalle = `
            SELECT d.*, prod.nombre AS producto_nombre, prod.codigo
            FROM detalle_compra d
            LEFT JOIN productos prod ON d.id_producto = prod.id
            WHERE d.id_compra = ?
        `;
        const [items] = await db.query(sqlDetalle, [id]);

        return {
            ...cabecera[0],
            items: items || []
        };
    }

    // ─── Función Principal de Registro y Actualización de Stock ─────────────
    static async create(data) {
        if (!data.id_proveedor) {
            throw new Error('Debe especificar un proveedor válido.');
        }
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            throw new Error('La compra no puede estar vacía. Añade al menos un producto.');
        }

        const id_compra = 'COMP-' + Date.now();
        const fecha_compra = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(new Date()).replace(',', '');

        let total_compra = 0;

        // 1. Inserción de la cabeza de compra
        await db.query(
            `INSERT INTO compras (id, id_proveedor, fecha_compra, total_compra) VALUES (?, ?, ?, 0)`,
            [id_compra, data.id_proveedor, fecha_compra] // El total se actualizará luego
        );

        // 2. Iterar items para registrar en detalles e incrementar STOCK
        for (const i of data.items) {
            const qty = parseInt(i.cantidad, 10);
            const price = parseFloat(i.precio_compra);
            
            if (isNaN(qty) || qty <= 0) throw new Error("Cantidad de producto inválida.");
            if (isNaN(price) || price < 0) throw new Error("Precio del producto inválido.");

            const subtotal = qty * price;
            total_compra += subtotal;

            const id_detalle = 'DET-' + Math.random().toString(36).substring(2, 9) + Date.now();

            // Insertar fila del detalle
            await db.query(
                `INSERT INTO detalle_compra (id, id_compra, id_producto, cantidad, precio_compra, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id_detalle, id_compra, i.id_producto, qty, price, subtotal]
            );

            // ACTUALIZAR EL STOCK Y POTENCIAL PRECIO_COMPRA AUTOMATICAMENTE
            // Acorde a reglas de negocio de inv, a veces se cruza el precio de compra.
            // Aca incrementaremos el stock. 
            await db.query(
                `UPDATE productos 
                 SET stock = stock + ?, 
                     precio_compra = ? 
                 WHERE id = ?`,
                [qty, price, i.id_producto]
            );
        }

        // 3. Actualizar el total maestro
        await db.query(
            `UPDATE compras SET total_compra = ? WHERE id = ?`,
            [total_compra, id_compra]
        );

        return { id: id_compra, status: 'success' };
    }
}

module.exports = ComprasModel;
