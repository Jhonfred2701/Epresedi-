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
    CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL
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
        fecha TEXT NOT NULL,
        clienteId TEXT,
        cliente TEXT,
        nit TEXT,
        contacto TEXT,
        total REAL DEFAULT 0,
        estado TEXT DEFAULT 'emitida',
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
    CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL
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
        fecha TEXT NOT NULL,
        "clienteId" TEXT REFERENCES clientes(id) ON DELETE SET NULL,
        cliente TEXT,
        nit TEXT,
        contacto TEXT,
        total NUMERIC DEFAULT 0,
        estado TEXT DEFAULT 'emitida'
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
