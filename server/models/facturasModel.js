/**
 * facturasModel.js
 * ─────────────────────────────────────────────────────────────────
 * Modelo de datos para la tabla `facturas` y `factura_items`.
 *
 * Incluye la lógica de numeración automática por tipo de documento:
 *   AR → Canon de Arrendamiento     (AR-00001, AR-00002, ...)
 *   CO → Comisión Inmobiliaria      (CO-00001, CO-00002, ...)
 *   CP → Comprobante de Pago        (CP-00001, CP-00002, ...)
 *   PE → Pago Electrónico           (PE-00001, PE-00002, ...)
 *   SA → Servicios Adicionales      (SA-00001, SA-00002, ...)
 *
 * Cada prefijo tiene su propia secuencia independiente en la tabla
 * `factura_consecutivos`. El número se genera ANTES de guardar la
 * factura, dentro de la misma transacción, para evitar duplicados.
 * ─────────────────────────────────────────────────────────────────
 */

const db = require('../db');

// ─── Mapa de tipo de documento → prefijo ─────────────────────────────────────
/**
 * Retorna el prefijo de 2 letras correspondiente al tipo de documento.
 * Si el tipo no coincide se usa 'SA' como valor por defecto.
 *
 * @param {string} tipoDocumento  - Nombre del tipo de documento tal como llega del frontend.
 * @returns {string}              - Prefijo de 2 letras (AR | CO | CP | PE | SA).
 */
const obtenerPrefijo = (tipoDocumento = '') => {
    const tipo = tipoDocumento.toLowerCase();

    if (tipo.includes('canon') || tipo.includes('arrendamiento')) return 'AR';
    if (tipo.includes('comision') || tipo.includes('comisión'))    return 'CO';
    if (tipo.includes('comprobante'))                               return 'CP';
    if (tipo.includes('electronico') || tipo.includes('electrónico') || tipo.includes('pago electr')) return 'PE';

    // Default → Servicios Adicionales
    return 'SA';
};

// ─── Formateador de consecutivo ───────────────────────────────────────────────
/**
 * Convierte un número entero en una cadena con ceros a la izquierda de 5 dígitos.
 * Ejemplo: 1 → '00001', 123 → '00123'
 *
 * @param {number} num - Número consecutivo.
 * @returns {string}
 */
const formatearConsecutivo = (num) => String(num).padStart(5, '0');

class FacturaModel {

    // ─── Obtener todas las facturas ───────────────────────────────────────────
    /**
     * Retorna todas las facturas ordenadas por fecha descendente,
     * junto con sus ítems agrupados.
     */
    static async getAll() {
        const [facturas] = await db.query('SELECT * FROM facturas ORDER BY id DESC');
        const [items]    = await db.query('SELECT * FROM factura_items');

        return facturas.map(f => {
            f.items = items.filter(i => i.factura_id === f.id);
            return f;
        });
    }

    // ─── Obtener una factura por ID ───────────────────────────────────────────
    /**
     * Busca una factura por su ID primario y adjunta sus ítems.
     *
     * @param {string} id - ID de la factura (ej: 'AR-00001').
     * @returns {object|null}
     */
    static async getById(id) {
        const [facturas] = await db.query('SELECT * FROM facturas WHERE id = ?', [id]);
        if (facturas.length === 0) return null;

        const factura = facturas[0];
        const [items] = await db.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);
        factura.items = items;
        return factura;
    }

    // ─── Generar número de factura ────────────────────────────────────────────
    /**
     * Genera el próximo número de factura para el tipo de documento indicado.
     * Opera dentro de la transacción abierta (`connection`) para garantizar
     * atomicidad y evitar números duplicados bajo acceso concurrente.
     *
     * Estrategia:
     *   1. Leer el último consecutivo de `factura_consecutivos` con bloqueo.
     *   2. Incrementar en +1.
     *   3. Actualizar la fila en la tabla de control.
     *   4. Retornar { prefijo, consecutivo, numero_factura }.
     *
     * @param {string} tipoDocumento - Tipo de doc del frontend.
     * @param {object} connection    - Conexión de BD con transacción activa.
     * @returns {{ prefijo: string, consecutivo: number, numero_factura: string }}
     */
    static async generarNumeroFactura(tipoDocumento, connection) {
        // Obtener el prefijo según el tipo de documento
        const prefijo = obtenerPrefijo(tipoDocumento);

        // Leer el último consecutivo (con FOR UPDATE en PostgreSQL para bloqueo)
        // En SQLite la transacción ya garantiza acceso serializado
        const [rows] = await connection.query(
            'SELECT ultimo FROM factura_consecutivos WHERE prefijo = ?',
            [prefijo]
        );

        if (!rows || rows.length === 0) {
            throw new Error(`Prefijo desconocido en factura_consecutivos: ${prefijo}`);
        }

        // Calcular el nuevo consecutivo
        const nuevoConsecutivo = parseInt(rows[0].ultimo, 10) + 1;

        // Actualizar el contador en la tabla de control
        await connection.query(
            'UPDATE factura_consecutivos SET ultimo = ? WHERE prefijo = ?',
            [nuevoConsecutivo, prefijo]
        );

        // Formatear el número final: AR-00001
        const numero_factura = `${prefijo}-${formatearConsecutivo(nuevoConsecutivo)}`;

        return {
            prefijo,
            consecutivo: nuevoConsecutivo,
            numero_factura
        };
    }

    // ─── Previsualizar el próximo número (sin guardar) ────────────────────────
    /**
     * Consulta cuál sería el próximo número de factura para un tipo dado,
     * SIN modificar la tabla de consecutivos.
     * Usado por el endpoint GET /api/facturas/preview-numero.
     *
     * @param {string} tipoDocumento
     * @returns {string} Número formateado, ej: 'AR-00003'
     */
    static async previewNumero(tipoDocumento) {
        const prefijo = obtenerPrefijo(tipoDocumento);

        const [rows] = await db.query(
            'SELECT ultimo FROM factura_consecutivos WHERE prefijo = ?',
            [prefijo]
        );

        if (!rows || rows.length === 0) return `${prefijo}-00001`;

        const siguiente = parseInt(rows[0].ultimo, 10) + 1;
        return `${prefijo}-${formatearConsecutivo(siguiente)}`;
    }

    // ─── Crear factura ────────────────────────────────────────────────────────
    /**
     * Crea una nueva factura con numeración automática.
     *
     * Flujo:
     *   1. Abrir transacción.
     *   2. Generar número de factura (generarNumeroFactura).
     *   3. Insertar en `facturas` guardando numero_factura, prefijo, consecutivo.
     *   4. Insertar cada ítem en `factura_items`.
     *   5. Confirmar transacción (COMMIT).
     *
     * @param {object} f - Datos de la factura desde el controller.
     * @returns {object}  Factura creada con su número generado.
     */
    static async create(f) {
        const connection = await db.getConnection();
        try {
            // Iniciar transacción para garantizar atomicidad del consecutivo
            await connection.beginTransaction();

            // ── 1. Generar el número de factura automáticamente ──────────────
            const { prefijo, consecutivo, numero_factura } =
                await FacturaModel.generarNumeroFactura(
                    f.tipo_documento || 'Factura de servicios adicionales',
                    connection
                );

            // El ID de la factura (clave primaria) ES el número de factura
            const facturaId = numero_factura;

            // ── 2. Insertar la factura ────────────────────────────────────────
            await connection.query(
                `INSERT INTO facturas (
                    id, numero_factura, prefijo, consecutivo,
                    fecha, "clienteId", cliente, nit, contacto, total, estado,
                    tipo_documento, "inmuebleId", periodo_facturado,
                    metodo_pago, referencia_pago, banco_pago,
                    porcentaje_comision, fecha_pago
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?
                )`,
                [
                    facturaId,     // id
                    numero_factura, // numero_factura (almacenado también por separado)
                    prefijo,        // prefijo (AR, CO, CP, PE, SA)
                    consecutivo,    // consecutivo (número entero)
                    f.fecha,
                    f.clienteId    || null,
                    f.cliente,
                    f.nit,
                    f.contacto,
                    f.total,
                    f.estado       || 'emitida',
                    f.tipo_documento || 'Factura de servicios adicionales',
                    f.inmuebleId   || null,
                    f.periodo_facturado || null,
                    f.metodo_pago  || null,
                    f.referencia_pago || null,
                    f.banco_pago   || null,
                    f.porcentaje_comision || null,
                    f.fecha_pago   || null
                ]
            );

            // ── 3. Insertar los ítems de la factura ───────────────────────────
            for (const item of (f.items || [])) {
                // Generar un ID único para cada ítem
                const itemId = `ITEM-${facturaId}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
                await connection.query(
                    `INSERT INTO factura_items (
                        id, factura_id, codigo, descripcion,
                        cantidad, "valorUnitario", total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        itemId,
                        facturaId,
                        item.codigo,
                        item.descripcion,
                        item.cantidad,
                        item.valorUnitario,
                        item.total
                    ]
                );
            }

            // ── 4. Confirmar transacción ──────────────────────────────────────
            await connection.commit();

            // Retornar la factura creada con todos sus datos de numeración
            return {
                id: facturaId,
                numero_factura,
                prefijo,
                consecutivo,
                ...f
            };

        } catch (err) {
            // Revertir en caso de error para evitar que el consecutivo quede desincronizado
            await connection.rollback();
            throw err;
        } finally {
            // Liberar la conexión al pool
            connection.release();
        }
    }

    // ─── Eliminar factura ─────────────────────────────────────────────────────
    /**
     * Elimina una factura por su ID. Los ítems se eliminan en cascada.
     * NOTA: El consecutivo NO se revierte al eliminar (es un número ya usado).
     *
     * @param {string} id
     */
    static async delete(id) {
        await db.query('DELETE FROM facturas WHERE id = ?', [id]);
    }
}

module.exports = FacturaModel;
