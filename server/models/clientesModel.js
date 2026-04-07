/**
 * clientesModel.js
 * ─────────────────────────────────────────────────────────────────
 * Modelo de datos para la tabla `clientes`.
 * 
 * Campos cubiertos:
 * - Básicos: id, nombre, telefono, correo, direccion, fecha_registro
 * - Fiscales: tipo_persona, tipo_doc, nit, ciudad, departamento, codigo_postal, estado
 * ─────────────────────────────────────────────────────────────────
 */

const db = require('../db');

class ClientesModel {

    // ─── Listar todos los clientes ──────────────────────────────────────────
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM clientes ORDER BY nombre ASC'
        );
        return rows;
    }

    // ─── Obtener cliente por ID ──────────────────────────────────────────────
    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM clientes WHERE id = ?', [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // ─── Lógica para Verificar Duplicación de Correo Electrónico ─────────────
    static async existeCorreo(correo, excluirId = null) {
        if (!correo) return false;
        
        // Uso de LOWER para comprobación no sensible a mayúsculas
        let sql = 'SELECT id FROM clientes WHERE LOWER(correo) = LOWER(?)';
        let params = [correo.trim()];

        // Omitir el cliente actual en operaciones de Actualización (Update)
        if (excluirId) {
            sql += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await db.query(sql, params);
        return rows.length > 0;
    }

    // ─── Lógica para Verificar Duplicación de NIT / Documento ────────────────
    static async existeNIT(nit, excluirId = null) {
        if (!nit) return false;
        let sql = 'SELECT id FROM clientes WHERE nit = ?';
        let params = [nit.trim()];
        if (excluirId) {
            sql += ' AND id != ?';
            params.push(excluirId);
        }
        const [rows] = await db.query(sql, params);
        return rows.length > 0;
    }

    // ─── Crear Cliente ───────────────────────────────────────────────────────
    static async create(data) {
        if (!data.nombre || !data.nombre.trim()) throw new Error('El nombre es obligatorio');
        if (!data.correo || !data.correo.trim()) throw new Error('El correo electrónico es obligatorio');

        // Validaciones Antidobles
        if (await ClientesModel.existeCorreo(data.correo)) {
            throw new Error(`Ya existe un cliente con el correo electrónico "${data.correo.trim()}"`);
        }
        
        if (data.nit && (await ClientesModel.existeNIT(data.nit))) {
            throw new Error(`El Documento / NIT "${data.nit.trim()}" ya está registrado a nombre de otro cliente`);
        }

        const id = 'CLI-' + Date.now();
        const fecha_registro = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());

        await db.query(`
            INSERT INTO clientes 
                (id, tipo_persona, estado, nombre, tipo_doc, nit, fecha_registro, telefono, correo, direccion, ciudad, departamento, codigo_postal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.tipo_persona || 'Empresa',
                data.estado || 'Activo',
                data.nombre.trim(),
                data.tipo_doc || 'NIT',
                data.nit ? data.nit.trim() : '',
                fecha_registro,
                data.telefono ? data.telefono.trim() : '',
                data.correo.trim(),
                data.direccion ? data.direccion.trim() : '',
                data.ciudad ? data.ciudad.trim() : '',
                data.departamento ? data.departamento.trim() : '',
                data.codigo_postal ? data.codigo_postal.trim() : ''
            ]
        );

        return { id, ...data, fecha_registro };
    }

    // ─── Actualizar Cliente ──────────────────────────────────────────────────
    static async update(id, data) {
        if (!data.nombre || !data.nombre.trim()) throw new Error('El nombre es obligatorio');
        if (!data.correo || !data.correo.trim()) throw new Error('El correo electrónico es obligatorio');

        // Validaciones Antidobles omitiendo su ID propio
        if (await ClientesModel.existeCorreo(data.correo, id)) {
            throw new Error(`El correo electrónico "${data.correo.trim()}" ya está adjudicado a otro cliente existente.`);
        }
        if (data.nit && (await ClientesModel.existeNIT(data.nit, id))) {
            throw new Error(`El Documento / NIT "${data.nit.trim()}" figura en el sistema a nombre de otro cliente.`);
        }

        await db.query(`
            UPDATE clientes 
            SET tipo_persona = ?, estado = ?, nombre = ?, tipo_doc = ?, nit = ?, 
                telefono = ?, correo = ?, direccion = ?, ciudad = ?, departamento = ?, codigo_postal = ?
            WHERE id = ?`,
            [
                data.tipo_persona || 'Empresa',
                data.estado || 'Activo',
                data.nombre.trim(),
                data.tipo_doc || 'NIT',
                data.nit ? data.nit.trim() : '',
                data.telefono ? data.telefono.trim() : '',
                data.correo.trim(),
                data.direccion ? data.direccion.trim() : '',
                data.ciudad ? data.ciudad.trim() : '',
                data.departamento ? data.departamento.trim() : '',
                data.codigo_postal ? data.codigo_postal.trim() : '',
                id
            ]
        );
    }

    // ─── Eliminar Cliente ────────────────────────────────────────────────────
    static async delete(id) {
        // En un futuro se podría validar si tiene facturas usando Foreign Keys, 
        // pero Postgres CASCADE o SET NULL (como dictamina la db configurada) resuelve el problema en cascada.
        await db.query('DELETE FROM clientes WHERE id = ?', [id]);
    }
}

module.exports = ClientesModel;
