/**
 * db.js — Adaptador de Base de Datos
 * - En PRODUCCIÓN (Render): usa PostgreSQL via DATABASE_URL
 * - En LOCAL: usa SQLite (no requiere configuración)
 * Expone la misma interfaz para que server.js no cambie.
 */

const IS_POSTGRES = !!process.env.DATABASE_URL;

// ─── POSTGRES ──────────────────────────────────────────────────────────────────
let pgPool = null;

if (IS_POSTGRES) {
    const { Pool } = require('pg');
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('🐘 Usando PostgreSQL (Render)');
}

// ─── SQLITE (local) ────────────────────────────────────────────────────────────
let sqliteDb = null;

// Convierte placeholders ? a $1, $2... para PostgreSQL
const toPgParams = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
};

// Convierte INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING (Postgres)
const toPostgresSQL = (sql) => {
    return sql
        .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO')
        .replace(/ON CONFLICT\s*\(\s*\)/gi, 'ON CONFLICT')
        + (sql.trim().toUpperCase().startsWith('INSERT') && sql.includes('OR IGNORE') ? ' ON CONFLICT DO NOTHING' : '');
};

// Normaliza el SQL para Postgres
const normalizeSql = (sql) => {
    let s = sql;
    if (s.trim().toUpperCase().startsWith('INSERT OR IGNORE')) {
        s = s.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
        // Agrega ON CONFLICT DO NOTHING al final si no tiene ya
        if (!s.toUpperCase().includes('ON CONFLICT')) {
            s = s.trimEnd() + ' ON CONFLICT DO NOTHING';
        }
    }
    return s;
};

// ─── SCHEMA ────────────────────────────────────────────────────────────────────
const SCHEMA_SQLITE = `
    CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        tipo_persona TEXT DEFAULT 'Empresa',
        estado TEXT DEFAULT 'Activo',
        nombre TEXT NOT NULL,
        tipo_doc TEXT DEFAULT 'NIT',
        nit TEXT NOT NULL,
        fecha_registro TEXT,
        telefono TEXT,
        correo TEXT,
        direccion TEXT,
        ciudad TEXT,
        departamento TEXT,
        codigo_postal TEXT
    );
    CREATE TABLE IF NOT EXISTS categorias (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        -- Estado de la categoría: Activo / Inactivo
        estado TEXT DEFAULT 'Activo',
        -- Fecha de creación en formato YYYY-MM-DD
        fecha_creacion TEXT
    );
    INSERT OR IGNORE INTO categorias (id, nombre, descripcion) VALUES ('CAT-GEN', 'General', 'Categoría por defecto');
    CREATE TABLE IF NOT EXISTS proveedores (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        contacto TEXT,
        telefono TEXT,
        correo TEXT UNIQUE,
        direccion TEXT,
        fecha_creacion TEXT
    );
    INSERT OR IGNORE INTO proveedores (id, nombre, contacto, telefono) VALUES ('PROV-GEN', 'Proveedor General', 'Administrador', '0000000000');
    CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        precio_compra NUMERIC DEFAULT 0,
        precio_venta NUMERIC DEFAULT 0,
        id_categoria TEXT DEFAULT 'CAT-GEN',
        id_proveedor TEXT DEFAULT 'PROV-GEN',
        fecha_creacion TEXT,
        FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL,
        FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE SET NULL
    );
    INSERT OR IGNORE INTO productos (id, codigo, nombre) VALUES 
        ('P1', 'ARR-01', 'Canon de Arrendamiento Comercial'),
        ('P2', 'ARR-02', 'Canon de Arrendamiento Residencial'),
        ('P3', 'COM-01', 'Comisión Inmobiliaria');
    CREATE TABLE IF NOT EXISTS inmuebles (
        id TEXT PRIMARY KEY,
        direccion TEXT NOT NULL,
        tipo TEXT,
        precio REAL,
        estado TEXT DEFAULT 'Disponible',
        clienteId TEXT,
        FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS facturas (
        id TEXT PRIMARY KEY,
        -- Número de factura con formato prefijo-consecutivo (ej: AR-00001)
        numero_factura TEXT UNIQUE,
        -- Prefijo del tipo de documento: AR, CO, CP, PE, SA
        prefijo TEXT,
        -- Número correlativo solo del consecutivo (número entero)
        consecutivo INTEGER,
        fecha TEXT NOT NULL,
        clienteId TEXT,
        cliente TEXT,
        nit TEXT,
        contacto TEXT,
        total REAL DEFAULT 0,
        estado TEXT DEFAULT 'emitida',
        tipo_documento TEXT DEFAULT 'Factura de servicios adicionales',
        inmuebleId TEXT,
        periodo_facturado TEXT,
        metodo_pago TEXT,
        referencia_pago TEXT,
        banco_pago TEXT,
        porcentaje_comision NUMERIC,
        fecha_pago TEXT,
        FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS factura_items (
        id TEXT PRIMARY KEY,
        factura_id TEXT NOT NULL,
        codigo TEXT,
        descripcion TEXT,
        cantidad INTEGER DEFAULT 1,
        valorUnitario REAL,
        total REAL,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS compras (
        id TEXT PRIMARY KEY,
        id_proveedor TEXT,
        fecha_compra TEXT,
        total_compra REAL DEFAULT 0,
        FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS detalle_compra (
        id TEXT PRIMARY KEY,
        id_compra TEXT NOT NULL,
        id_producto TEXT,
        cantidad INTEGER DEFAULT 1,
        precio_compra REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        FOREIGN KEY (id_compra) REFERENCES compras(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
    );
    -- Tabla de control de consecutivos por tipo de documento
    -- Cada prefijo mantiene su propio contador independiente
    CREATE TABLE IF NOT EXISTS factura_consecutivos (
        prefijo TEXT PRIMARY KEY,  -- 'AR', 'CO', 'CP', 'PE', 'SA'
        ultimo  INTEGER DEFAULT 0  -- último consecutivo usado
    );
    -- Sembrar los 5 prefijos si aún no existen
    INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES
        ('AR', 0), ('CO', 0), ('CP', 0), ('PE', 0), ('SA', 0);
    CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        correo TEXT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT,
        estado TEXT DEFAULT 'Activo',
        fecha_registro TEXT
    );
`;

const SCHEMA_POSTGRES = `
    CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        tipo_persona TEXT DEFAULT 'Empresa',
        estado TEXT DEFAULT 'Activo',
        nombre TEXT NOT NULL,
        tipo_doc TEXT DEFAULT 'NIT',
        nit TEXT NOT NULL,
        fecha_registro TEXT,
        telefono TEXT,
        correo TEXT,
        direccion TEXT,
        ciudad TEXT,
        departamento TEXT,
        codigo_postal TEXT
    );
    CREATE TABLE IF NOT EXISTS categorias (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        -- Estado de la categoría: Activo / Inactivo
        estado TEXT DEFAULT 'Activo',
        -- Fecha de creación en formato YYYY-MM-DD
        fecha_creacion TEXT
    );
    INSERT INTO categorias (id, nombre, descripcion) VALUES ('CAT-GEN', 'General', 'Categoría por defecto') ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS proveedores (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        contacto TEXT,
        telefono TEXT,
        correo TEXT UNIQUE,
        direccion TEXT,
        fecha_creacion TEXT
    );
    INSERT INTO proveedores (id, nombre, contacto, telefono) VALUES ('PROV-GEN', 'Proveedor General', 'Administrador', '0000000000') ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        precio_compra NUMERIC DEFAULT 0,
        precio_venta NUMERIC DEFAULT 0,
        id_categoria TEXT REFERENCES categorias(id) ON DELETE SET NULL DEFAULT 'CAT-GEN',
        id_proveedor TEXT REFERENCES proveedores(id) ON DELETE SET NULL DEFAULT 'PROV-GEN',
        fecha_creacion TEXT
    );
    INSERT INTO productos (id, codigo, nombre) VALUES 
        ('P1', 'ARR-01', 'Canon de Arrendamiento Comercial'),
        ('P2', 'ARR-02', 'Canon de Arrendamiento Residencial'),
        ('P3', 'COM-01', 'Comisión Inmobiliaria')
    ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS inmuebles (
        id TEXT PRIMARY KEY,
        direccion TEXT NOT NULL,
        tipo TEXT,
        precio NUMERIC,
        estado TEXT DEFAULT 'Disponible',
        "clienteId" TEXT REFERENCES clientes(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS facturas (
        id TEXT PRIMARY KEY,
        -- Número de factura con formato prefijo-consecutivo (ej: AR-00001)
        numero_factura TEXT UNIQUE,
        -- Prefijo del tipo de documento: AR, CO, CP, PE, SA
        prefijo TEXT,
        -- Número correlativo solo del consecutivo (número entero)
        consecutivo INTEGER,
        fecha TEXT NOT NULL,
        "clienteId" TEXT REFERENCES clientes(id) ON DELETE SET NULL,
        cliente TEXT,
        nit TEXT,
        contacto TEXT,
        total NUMERIC DEFAULT 0,
        estado TEXT DEFAULT 'emitida',
        tipo_documento TEXT DEFAULT 'Factura de servicios adicionales',
        "inmuebleId" TEXT,
        periodo_facturado TEXT,
        metodo_pago TEXT,
        referencia_pago TEXT,
        banco_pago TEXT,
        porcentaje_comision NUMERIC,
        fecha_pago TEXT
    );
    CREATE TABLE IF NOT EXISTS factura_items (
        id TEXT PRIMARY KEY,
        factura_id TEXT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
        codigo TEXT,
        descripcion TEXT,
        cantidad INTEGER DEFAULT 1,
        "valorUnitario" NUMERIC,
        total NUMERIC
    );
    CREATE TABLE IF NOT EXISTS compras (
        id TEXT PRIMARY KEY,
        id_proveedor TEXT REFERENCES proveedores(id) ON DELETE SET NULL,
        fecha_compra TEXT,
        total_compra NUMERIC DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS detalle_compra (
        id TEXT PRIMARY KEY,
        id_compra TEXT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
        id_producto TEXT REFERENCES productos(id) ON DELETE SET NULL,
        cantidad INTEGER DEFAULT 1,
        precio_compra NUMERIC DEFAULT 0,
        subtotal NUMERIC DEFAULT 0
    );
    -- Tabla de control de consecutivos por tipo de documento
    -- Cada prefijo mantiene su propio contador independiente
    CREATE TABLE IF NOT EXISTS factura_consecutivos (
        prefijo TEXT PRIMARY KEY,  -- 'AR', 'CO', 'CP', 'PE', 'SA'
        ultimo  INTEGER DEFAULT 0  -- último consecutivo usado
    );
    -- Sembrar los 5 prefijos si aún no existen
    INSERT INTO factura_consecutivos (prefijo, ultimo) VALUES
        ('AR', 0), ('CO', 0), ('CP', 0), ('PE', 0), ('SA', 0)
    ON CONFLICT (prefijo) DO NOTHING;
    CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        correo TEXT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT,
        estado TEXT DEFAULT 'Activo',
        fecha_registro TEXT
    );
`;

// ─── WRAPPER UNIFICADO ─────────────────────────────────────────────────────────
let initialized = false;

const dbWrapper = {

    async _init() {
        if (initialized) return;
        initialized = true;

        if (IS_POSTGRES) {
            await pgPool.query(SCHEMA_POSTGRES);
            try { await pgPool.query('ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0'); } catch(e){}
            try { await pgPool.query('ALTER TABLE productos ADD COLUMN precio_compra NUMERIC DEFAULT 0'); } catch(e){}
            try { await pgPool.query('ALTER TABLE productos ADD COLUMN precio_venta NUMERIC DEFAULT 0'); } catch(e){}
            try { await pgPool.query(`ALTER TABLE productos ADD COLUMN id_categoria TEXT DEFAULT 'CAT-GEN'`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE productos ADD COLUMN id_proveedor TEXT DEFAULT 'PROV-GEN'`); } catch(e){}
            try { await pgPool.query('ALTER TABLE productos ADD COLUMN fecha_creacion TEXT'); } catch(e){}

            // Migraciones para Categorías
            try { await pgPool.query(`ALTER TABLE categorias ADD COLUMN estado TEXT DEFAULT 'Activo'`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE categorias ADD COLUMN fecha_creacion TEXT`); } catch(e){}

            // Migraciones para Proveedores
            try { await pgPool.query(`ALTER TABLE proveedores ADD COLUMN correo TEXT UNIQUE`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE proveedores ADD COLUMN direccion TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE proveedores ADD COLUMN fecha_creacion TEXT`); } catch(e){}

            // Migraciones para Módulo de Ventas Inmobiliario (Facturas)
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN tipo_documento TEXT DEFAULT 'Factura de servicios adicionales'`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN "inmuebleId" TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN periodo_facturado TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN metodo_pago TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN referencia_pago TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN banco_pago TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN porcentaje_comision NUMERIC`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN fecha_pago TEXT`); } catch(e){}
            // Migraciones para Numeración Automática de Facturas
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN numero_factura TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN prefijo TEXT`); } catch(e){}
            try { await pgPool.query(`ALTER TABLE facturas ADD COLUMN consecutivo INTEGER`); } catch(e){}
            // Crear tabla de consecutivos y sembrar prefijos (si aún no existe)
            try {
                await pgPool.query(`
                    CREATE TABLE IF NOT EXISTS factura_consecutivos (
                        prefijo TEXT PRIMARY KEY,
                        ultimo  INTEGER DEFAULT 0
                    )
                `);
                await pgPool.query(`
                    INSERT INTO factura_consecutivos (prefijo, ultimo) VALUES
                        ('AR', 0), ('CO', 0), ('CP', 0), ('PE', 0), ('SA', 0)
                    ON CONFLICT (prefijo) DO NOTHING
                `);
            } catch(e){ console.error('Error creando factura_consecutivos en PG:', e); }
        } else {
            const sqlite3 = require('sqlite3').verbose();
            const { open } = require('sqlite');
            const path = require('path');
            const fs = require('fs');
            const dataDir = path.join(__dirname);
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            sqliteDb = await open({ filename: path.join(dataDir, 'epresedi.db'), driver: sqlite3.Database });
            await sqliteDb.run('PRAGMA foreign_keys = ON');
            await sqliteDb.exec(SCHEMA_SQLITE);
            try { await sqliteDb.run('ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0'); } catch(e){}
            try { await sqliteDb.run('ALTER TABLE productos ADD COLUMN precio_compra NUMERIC DEFAULT 0'); } catch(e){}
            try { await sqliteDb.run('ALTER TABLE productos ADD COLUMN precio_venta NUMERIC DEFAULT 0'); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE productos ADD COLUMN id_categoria TEXT DEFAULT 'CAT-GEN'`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE productos ADD COLUMN id_proveedor TEXT DEFAULT 'PROV-GEN'`); } catch(e){}
            try { await sqliteDb.run('ALTER TABLE productos ADD COLUMN fecha_creacion TEXT'); } catch(e){}

            // Migraciones para Categorías
            try { await sqliteDb.run(`ALTER TABLE categorias ADD COLUMN estado TEXT DEFAULT 'Activo'`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE categorias ADD COLUMN fecha_creacion TEXT`); } catch(e){}

            // Migraciones para Proveedores
            try { await sqliteDb.run(`ALTER TABLE proveedores ADD COLUMN correo TEXT UNIQUE`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE proveedores ADD COLUMN direccion TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE proveedores ADD COLUMN fecha_creacion TEXT`); } catch(e){}

            // Migraciones para Módulo de Ventas Inmobiliario (Facturas)
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN tipo_documento TEXT DEFAULT 'Factura de servicios adicionales'`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN inmuebleId TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN periodo_facturado TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN metodo_pago TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN referencia_pago TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN banco_pago TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN porcentaje_comision NUMERIC`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN fecha_pago TEXT`); } catch(e){}
            // Migraciones para Numeración Automática de Facturas
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN numero_factura TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN prefijo TEXT`); } catch(e){}
            try { await sqliteDb.run(`ALTER TABLE facturas ADD COLUMN consecutivo INTEGER`); } catch(e){}
            // Crear tabla de consecutivos y sembrar prefijos (si aún no existe)
            try {
                await sqliteDb.run(`
                    CREATE TABLE IF NOT EXISTS factura_consecutivos (
                        prefijo TEXT PRIMARY KEY,
                        ultimo  INTEGER DEFAULT 0
                    )
                `);
                await sqliteDb.run(`INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES ('AR', 0)`);
                await sqliteDb.run(`INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES ('CO', 0)`);
                await sqliteDb.run(`INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES ('CP', 0)`);
                await sqliteDb.run(`INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES ('PE', 0)`);
                await sqliteDb.run(`INSERT OR IGNORE INTO factura_consecutivos (prefijo, ultimo) VALUES ('SA', 0)`);
            } catch(e){ console.error('Error creando factura_consecutivos en SQLite:', e); }
        }
    },

    async query(sql, params = []) {
        await this._init();
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        if (IS_POSTGRES) {
            const pgSql = toPgParams(normalizeSql(sql));
            const result = await pgPool.query(pgSql, params);
            return isSelect ? [result.rows] : [result];
        } else {
            const rows = isSelect
                ? await sqliteDb.all(sql, params)
                : await sqliteDb.run(sql, params);
            return [rows];
        }
    },

    async getConnection() {
        await this._init();

        if (IS_POSTGRES) {
            const client = await pgPool.connect();
            return {
                query: async (sql, params = []) => {
                    const pgSql = toPgParams(normalizeSql(sql));
                    const result = await client.query(pgSql, params);
                    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
                    return isSelect ? [result.rows] : [result];
                },
                beginTransaction: async () => await client.query('BEGIN'),
                commit: async () => await client.query('COMMIT'),
                rollback: async () => await client.query('ROLLBACK'),
                release: () => client.release()
            };
        } else {
            return {
                query: async (sql, params = []) => {
                    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
                    const rows = isSelect
                        ? await sqliteDb.all(sql, params)
                        : await sqliteDb.run(sql, params);
                    return [rows];
                },
                beginTransaction: async () => await sqliteDb.run('BEGIN TRANSACTION'),
                commit: async () => await sqliteDb.run('COMMIT'),
                rollback: async () => await sqliteDb.run('ROLLBACK'),
                release: () => {}
            };
        }
    }
};

module.exports = dbWrapper;
