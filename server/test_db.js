const db = require('./db.js');
db.query('SELECT * FROM usuarios').then(() => {
    console.log("DB init y consultas exitosas!");
    process.exit(0);
}).catch(e => {
    console.error("Error en DB:", e);
    process.exit(1);
});
