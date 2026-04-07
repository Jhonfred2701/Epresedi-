/**
 * categoriasModel.js
 * ─────────────────────────────────────────────────────────────────
 * Modelo de datos para la tabla `categorias`.
 *
 * La tabla categorias es transversal: puede asignarse a
 * productos, servicios y facturas del sistema.
 *
 * Campos: id_categoria, nombre, descripcion, estado, fecha_creacion
 * ─────────────────────────────────────────────────────────────────
 */

const db = require('../db');

class CategoriaModel {

    // ─── Listar todas las categorías ──────────────────────────────────────────
    /**
     * Retorna todas las categorías ordenadas por nombre ascendente.
     * @returns {Array} Lista de categorías
     */
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM categorias ORDER BY nombre ASC'
        );
        return rows;
    }

    // ─── Obtener por ID ───────────────────────────────────────────────────────
    /**
     * Busca una categoría por su ID primario.
     * @param {string} id
     * @returns {object|null}
     */
    static async getById(id) {
        const [rows] = await db.query(
            'SELECT * FROM categorias WHERE id = ?', [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    // ─── Verificar si existe por nombre (para evitar duplicados) ──────────────
    /**
     * Busca si ya existe una categoría con el mismo nombre (sin importar mayúsculas).
     * Se puede excluir un ID para el caso de edición.
     *
     * @param {string} nombre       - Nombre a validar
     * @param {string|null} excluirId - ID a excluir de la búsqueda (útil en UPDATE)
     * @returns {boolean} true si ya existe
     */
    static async existeNombre(nombre, excluirId = null) {
        let sql    = 'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)';
        let params = [nombre.trim()];

        if (excluirId) {
            sql   += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await db.query(sql, params);
        return rows.length > 0;
    }

    // ─── Crear categoría ──────────────────────────────────────────────────────
    /**
     * Inserta una nueva categoría en la base de datos.
     * Valida que el nombre no esté duplicado antes de insertar.
     *
     * @param {object} data - { nombre, descripcion, estado }
     * @returns {object} Categoría creada con su ID generado
     */
    static async create(data) {
        // Validación: nombre requerido
        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre de la categoría es obligatorio');
        }

        // Validación: sin duplicados
        const duplicado = await CategoriaModel.existeNombre(data.nombre);
        if (duplicado) {
            throw new Error(`Ya existe una categoría con el nombre "${data.nombre.trim()}"`);
        }

        // Generar ID único con prefijo CAT-
        const id = 'CAT-' + Date.now();

        // Fecha de creación en zona horaria Colombia
        const fecha_creacion = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());

        await db.query(
            `INSERT INTO categorias (id, nombre, descripcion, estado, fecha_creacion)
             VALUES (?, ?, ?, ?, ?)`,
            [
                id,
                data.nombre.trim(),
                data.descripcion ? data.descripcion.trim() : '',
                data.estado || 'Activo',
                fecha_creacion
            ]
        );

        return { id, ...data, fecha_creacion };
    }

    // ─── Actualizar categoría ─────────────────────────────────────────────────
    /**
     * Actualiza los datos de una categoría existente.
     * Valida que el nuevo nombre no ya lo tenga otra categoría distinta.
     *
     * @param {string} id   - ID de la categoría a actualizar
     * @param {object} data - { nombre, descripcion, estado }
     */
    static async update(id, data) {
        // Validación: nombre requerido
        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre de la categoría es obligatorio');
        }

        // Validación: sin duplicados (excluyendo la propia categoría)
        const duplicado = await CategoriaModel.existeNombre(data.nombre, id);
        if (duplicado) {
            throw new Error(`Ya existe otra categoría con el nombre "${data.nombre.trim()}"`);
        }

        await db.query(
            `UPDATE categorias
             SET nombre = ?, descripcion = ?, estado = ?
             WHERE id = ?`,
            [
                data.nombre.trim(),
                data.descripcion ? data.descripcion.trim() : '',
                data.estado || 'Activo',
                id
            ]
        );
    }

    // ─── Eliminar categoría ───────────────────────────────────────────────────
    /**
     * Elimina una categoría por su ID.
     * NOTA: Si hay productos asignados a esta categoría, quedarán con
     * id_categoria apuntando a un registro eliminado. Se recomienda
     * verificar dependencias antes de eliminar en producción.
     *
     * @param {string} id
     */
    static async delete(id) {
        await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    }
}

module.exports = CategoriaModel;
