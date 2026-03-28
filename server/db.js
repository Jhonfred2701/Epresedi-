const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Wrapper de SQLite para simular el comportamiento de mysql2/promise
// Así no tenemos que modificar ni una sola línea de server.js
const dbWrapper = {
    _db: null,
    
    async _init() {
        if (!this._db) {
            // En Glitch, usar la carpeta .data que persiste entre reinicios
            // En local, usar la carpeta server/
            const dataDir = process.env.PROJECT_DOMAIN 
                ? path.join(__dirname, '../../.data')
                : path.join(__dirname);
            
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            
            this._db = await open({
                filename: path.join(dataDir, 'epresedi.db'),
                driver: sqlite3.Database
            });
            
            // Habilitar soporte para Foreign Keys
            await this._db.run('PRAGMA foreign_keys = ON');

            // Inicialización automática de tablas
            await this._db.exec(`
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
            `);
        }
        return this._db;
    },

    async query(sql, params = []) {
        const db = await this._init();
        
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        
        if (isSelect) {
            const rows = await db.all(sql, params);
            return [rows]; 
        } else {
            const result = await db.run(sql, params);
            return [result]; 
        }
    },
    
    // Para transacciones en facturas
    async getConnection() {
        const dbContext = await this._init();
        
        return {
            query: async (sql, params) => {
                const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
                if (isSelect) {
                    const rows = await dbContext.all(sql, params);
                    return [rows];
                } else {
                    const result = await dbContext.run(sql, params);
                    return [result];
                }
            },
            beginTransaction: async () => await dbContext.run('BEGIN TRANSACTION'),
            commit: async () => await dbContext.run('COMMIT'),
            rollback: async () => await dbContext.run('ROLLBACK'),
            release: () => { /* No hace falta liberar en sqlite */ }
        };
    }
};

module.exports = dbWrapper;
