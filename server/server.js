const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (para Glitch)
app.use(express.static(path.join(__dirname, '../')));

// =======================
// AUTHENTICATION & USUARIOS
// =======================

// Crear Admin por defecto automáticamente si la tabla está vacía
const createDefaultAdmin = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE username = 'admin'");
        if (rows.length === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            const fecha = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            await db.query(`INSERT INTO usuarios (id, nombre, correo, username, password, rol, estado, fecha_registro) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                            ['U-ADMIN', 'Administrador Principal', 'admin@epresedi.com', 'admin', hash, 'Administrador', 'Activo', fecha]);
            console.log('✅ Usuario Administrador por defecto creado (Usuario: admin, Clave: admin123)');
        }
    } catch(e) { console.error('Error verificando admin', e); }
};
createDefaultAdmin();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
        if (rows.length > 0) {
            const user = rows[0];
            if(user.estado !== 'Activo') return res.status(403).json({ success: false, message: 'Usuario inactivo' });
            
            const match = await bcrypt.compare(password, user.password);
            if(match) {
                delete user.password; // No enviar la contraseña encriptada al frontend
                return res.json({ success: true, user });
            }
        }
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRUD Usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, correo, username, rol, estado, fecha_registro FROM usuarios ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usuarios', async (req, res) => {
    try {
        const u = req.body;
        const [exist] = await db.query('SELECT username FROM usuarios WHERE username = ?', [u.username]);
        if (exist.length > 0) return res.status(400).json({ error: 'El nombre de usuario ya existe' });

        const hash = await bcrypt.hash(u.password, 10);
        const id = 'U-' + Date.now();
        await db.query(`INSERT INTO usuarios (id, nombre, correo, username, password, rol, estado, fecha_registro) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [id, u.nombre, u.correo, u.username, hash, u.rol, u.estado, u.fecha_registro]);
        
        res.json({ id, ...u, password: null });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const u = req.body;
        // Si mandan password, lo actualizamos, sino dejamos el existente
        if (u.password && u.password.trim() !== '') {
            const hash = await bcrypt.hash(u.password, 10);
            await db.query(`UPDATE usuarios SET nombre=?, correo=?, username=?, password=?, rol=?, estado=? WHERE id=?`, 
            [u.nombre, u.correo, u.username, hash, u.rol, u.estado, req.params.id]);
        } else {
            await db.query(`UPDATE usuarios SET nombre=?, correo=?, username=?, rol=?, estado=? WHERE id=?`, 
            [u.nombre, u.correo, u.username, u.rol, u.estado, req.params.id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =======================
// CLIENTES (CRUD)
// =======================
app.get('/api/clientes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const c = req.body;
        const id = 'C' + Date.now();
        await db.query(`INSERT INTO clientes (id, tipo_persona, estado, nombre, tipo_doc, nit, fecha_registro, telefono, correo, direccion, ciudad, departamento, codigo_postal) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [id, c.tipo_persona, c.estado, c.nombre, c.tipo_doc, c.nit, c.fecha_registro, c.telefono, c.correo, c.direccion, c.ciudad, c.departamento, c.codigo_postal]);
        res.json({ id, ...c });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const c = req.body;
        await db.query(`UPDATE clientes SET tipo_persona=?, estado=?, nombre=?, tipo_doc=?, nit=?, fecha_registro=?, telefono=?, correo=?, direccion=?, ciudad=?, departamento=?, codigo_postal=? WHERE id=?`, 
        [c.tipo_persona, c.estado, c.nombre, c.tipo_doc, c.nit, c.fecha_registro, c.telefono, c.correo, c.direccion, c.ciudad, c.departamento, c.codigo_postal, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =======================
// CATEGORIAS & PROVEEDORES
// =======================
const categoriasRoutes = require('./routes/categoriasRoutes');
app.use('/api/categorias', categoriasRoutes);


const proveedoresRoutes = require('./routes/proveedoresRoutes');
app.use('/api/proveedores', proveedoresRoutes);

const comprasRoutes = require('./routes/comprasRoutes');
app.use('/api/compras', comprasRoutes);

// =======================
// PRODUCTOS (CRUD)
// =======================
app.get('/api/productos', async (req, res) => {
    try {
        const sql = `
            SELECT p.*, 
                   c.nombre as categoria_nombre, 
                   pr.nombre as proveedor_nombre 
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id
            LEFT JOIN proveedores pr ON p.id_proveedor = pr.id
            ORDER BY p.codigo ASC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/productos', async (req, res) => {
    try {
        const p = req.body;
        const id = 'P' + Date.now();
        const fecha = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        await db.query(`INSERT INTO productos (id, codigo, nombre, stock, precio_compra, precio_venta, id_categoria, id_proveedor, fecha_creacion) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                        [id, p.codigo, p.nombre, p.stock || 0, p.precio_compra || 0, p.precio_venta || 0, p.id_categoria || 'CAT-GEN', p.id_proveedor || 'PROV-GEN', fecha]);
        res.json({ id, ...p, fecha_creacion: fecha });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/productos/:id', async (req, res) => {
    try {
        const p = req.body;
        await db.query(`UPDATE productos SET codigo=?, nombre=?, stock=?, precio_compra=?, precio_venta=?, id_categoria=?, id_proveedor=? WHERE id=?`, 
                       [p.codigo, p.nombre, p.stock || 0, p.precio_compra || 0, p.precio_venta || 0, p.id_categoria || 'CAT-GEN', p.id_proveedor || 'PROV-GEN', req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =======================
// INMUEBLES (CRUD)
// =======================
app.get('/api/inmuebles', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inmuebles ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inmuebles', async (req, res) => {
    try {
        const { direccion, tipo, precio, estado, clienteId } = req.body;
        const id = 'I' + Date.now();
        await db.query('INSERT INTO inmuebles (id, direccion, tipo, precio, estado, clienteId) VALUES (?, ?, ?, ?, ?, ?)', 
        [id, direccion, tipo, precio || 0, estado || 'Disponible', clienteId || null]);
        res.json({ id, direccion, tipo, precio, estado, clienteId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inmuebles/:id', async (req, res) => {
    try {
        const { direccion, tipo, precio, estado, clienteId } = req.body;
        await db.query('UPDATE inmuebles SET direccion=?, tipo=?, precio=?, estado=?, clienteId=? WHERE id=?', 
        [direccion, tipo, precio, estado, clienteId || null, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inmuebles/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM inmuebles WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =======================
// FACTURAS (MVC Routes)
// =======================
const facturasRoutes = require('./routes/facturasRoutes');
app.use('/api/facturas', facturasRoutes);

// =======================
// DASHBOARD STATS
// =======================
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const [prodCount] = await db.query('SELECT COUNT(*) as c FROM productos');
        const [factCount] = await db.query('SELECT COUNT(*) as c FROM facturas');
        const [clientCount] = await db.query('SELECT COUNT(*) as c FROM clientes');
        const [salesTotal] = await db.query('SELECT SUM(total) as s FROM facturas');
        const [lowStock] = await db.query('SELECT COUNT(*) as c FROM productos WHERE stock >= 0 AND stock < 10');

        // Normalizamos valores porque PostgreSQL devuelve COUNT como String, y SQLite como Number
        res.json({
            totalProductos: parseInt(prodCount[0].c || 0),
            totalVentas: parseInt(factCount[0].c || 0),
            totalClientes: parseInt(clientCount[0].c || 0),
            ingresosTotales: parseFloat(salesTotal[0].s || 0),
            lowStock: parseInt(lowStock[0].c || 0)
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ruta comodín: redirige todo lo demás al index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Iniciar servidor (usa PORT de Glitch o 3000 en local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
});
