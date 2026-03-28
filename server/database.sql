-- Script de inicialización de Base de Datos para EPRESEDI S.A.S.
-- Copia e ingresa todo este script en MySQL Workbench y presiona el rayo (ejecutar)

CREATE DATABASE IF NOT EXISTS epresedi_db;
USE epresedi_db;

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(50) PRIMARY KEY,
    tipo_persona VARCHAR(50) DEFAULT 'Empresa',
    estado VARCHAR(20) DEFAULT 'Activo',
    nombre VARCHAR(255) NOT NULL,
    tipo_doc VARCHAR(20) DEFAULT 'NIT',
    nit VARCHAR(50) NOT NULL,
    fecha_registro DATE,
    telefono VARCHAR(50),
    correo VARCHAR(255),
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    codigo_postal VARCHAR(20)
);

-- Tabla de Productos / Servicios
CREATE TABLE IF NOT EXISTS productos (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL
);

-- Insertar Productos por Defecto
INSERT IGNORE INTO productos (id, codigo, nombre) VALUES 
('P1', 'ARR-01', 'Canon de Arrendamiento Comercial'),
('P2', 'ARR-02', 'Canon de Arrendamiento Residencial'),
('P3', 'COM-01', 'Comisión Inmobiliaria');

-- Tabla de Inmuebles
CREATE TABLE IF NOT EXISTS inmuebles (
    id VARCHAR(50) PRIMARY KEY,
    direccion TEXT NOT NULL,
    tipo VARCHAR(100),
    precio DECIMAL(15,2),
    estado VARCHAR(50) DEFAULT 'Disponible',
    clienteId VARCHAR(50),
    FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabla de Facturas
CREATE TABLE IF NOT EXISTS facturas (
    id VARCHAR(50) PRIMARY KEY,
    fecha DATE NOT NULL,
    clienteId VARCHAR(50),
    cliente VARCHAR(255),
    nit VARCHAR(50),
    contacto TEXT,
    total DECIMAL(15,2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'emitida',
    FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabla de Items de Facturas
CREATE TABLE IF NOT EXISTS factura_items (
    id VARCHAR(50) PRIMARY KEY,
    factura_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50),
    descripcion VARCHAR(255),
    cantidad INT DEFAULT 1,
    valorUnitario DECIMAL(15,2),
    total DECIMAL(15,2),
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- Tabla de Usuarios (Solo 1 admin temporal por simplicidad)
CREATE TABLE IF NOT EXISTS usuarios (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

INSERT IGNORE INTO usuarios (username, password) VALUES ('admin', '123');

SELECT * FROM epresedi_db.clientes;