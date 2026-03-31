const db = require('../db');

class FacturaModel {
    static async getAll() {
        const [facturas] = await db.query('SELECT * FROM facturas ORDER BY id DESC');
        const [items] = await db.query('SELECT * FROM factura_items');
        
        return facturas.map(f => {
            f.items = items.filter(i => i.factura_id === f.id);
            return f;
        });
    }

    static async getById(id) {
        const [facturas] = await db.query('SELECT * FROM facturas WHERE id = ?', [id]);
        if (facturas.length === 0) return null;
        
        const factura = facturas[0];
        const [items] = await db.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);
        factura.items = items;
        return factura;
    }

    static async create(f) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const [rows] = await connection.query('SELECT COUNT(*) as count FROM facturas');
            const numero = parseInt(rows[0].count) + 9227; 
            const facturaId = 'FV-' + numero;
            
            await connection.query(
                `INSERT INTO facturas (id, fecha, "clienteId", cliente, nit, contacto, total, estado,
                    tipo_documento, "inmuebleId", periodo_facturado, metodo_pago, referencia_pago, banco_pago, porcentaje_comision, fecha_pago) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    facturaId, f.fecha, f.clienteId || null, f.cliente, f.nit, f.contacto, f.total, f.estado || 'emitida',
                    f.tipo_documento || 'Factura de servicios adicionales',
                    f.inmuebleId || null,
                    f.periodo_facturado || null,
                    f.metodo_pago || null,
                    f.referencia_pago || null,
                    f.banco_pago || null,
                    f.porcentaje_comision || null,
                    f.fecha_pago || null
                ]
            );
            
            for (const item of f.items) {
                const itemId = 'FI-' + Date.now() + Math.floor(Math.random() * 1000);
                await connection.query(
                    `INSERT INTO factura_items (id, factura_id, codigo, descripcion, cantidad, "valorUnitario", total) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [itemId, facturaId, item.codigo, item.descripcion, item.cantidad, item.valorUnitario, item.total]
                );
            }
            
            await connection.commit();
            return { id: facturaId, ...f, numero };
        } catch (err) { 
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        await db.query('DELETE FROM facturas WHERE id = ?', [id]);
    }
}

module.exports = FacturaModel;
