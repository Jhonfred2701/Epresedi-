const bcrypt = require('bcryptjs');
const db = require('./db');

async function resetAdmin() {
    try {
        console.log("Conectando a la base de datos...");
        // Verificar si existe el usuario
        const [rows] = await db.query("SELECT * FROM usuarios WHERE username = 'admin'");
        
        const hash = await bcrypt.hash('admin123', 10);
        
        if (rows.length === 0) {
            console.log("El usuario admin no existe. Creando uno nuevo...");
            const fecha = new Date().toISOString().split('T')[0];
            await db.query(`INSERT INTO usuarios (id, nombre, correo, username, password, rol, estado, fecha_registro) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                            ['U-ADMIN', 'Administrador Principal', 'admin@epresedi.com', 'admin', hash, 'Administrador', 'Activo', fecha]);
            console.log('✅ Usuario Administrador creado exitosamente (Usuario: admin, Clave: admin123)');
        } else {
            console.log("El usuario admin ya existe. Actualizando la contraseña a formato encriptado...");
            await db.query("UPDATE usuarios SET password = ? WHERE username = 'admin'", [hash]);
            console.log('✅ Contraseña actualizada correctamente (Usuario: admin, Clave: admin123)');
        }
    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            console.error("❌ ERROR: No se pudo conectar a la base de datos MySQL. Asegúrate de que XAMPP/WAMP esté ejecutándose y MySQL esté iniciado.");
        } else {
            console.error("❌ ERROR:", e.message);
        }
    } finally {
        process.exit();
    }
}

resetAdmin();
