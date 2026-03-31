const nodemailer = require('nodemailer');
const FacturaModel = require('../models/facturasModel');

// Configuración genérica de Nodemailer (Recomendado cambiar a SMTP real en Prod)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mylene.hegmann58@ethereal.email',
        pass: 'uP6Ry6n5jKp8XZQ8T2'
    }
});

class FacturasController {
    static async getAll(req, res) {
        try {
            const facturas = await FacturaModel.getAll();
            res.json(facturas);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async create(req, res) {
        try {
            const factura = await FacturaModel.create(req.body);
            res.json(factura);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async delete(req, res) {
        try {
            await FacturaModel.delete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async downloadPDF(req, res) {
        // Redirigir al inicio porque PDF ahora se maneja 100% en Frontend con html2pdf
        res.redirect('/#historial');
    }

    static async sendEmail(req, res) {
        try {
            const id = req.params.id;
            const factura = await FacturaModel.getById(id);
            if (!factura) return res.status(404).json({ error: "Factura no encontrada" });
            
            const emailDestino = req.body.correo || 'cliente@ejemplo.com'; 
            const base64Data = req.body.fileData; // Viene del frontend generador PDF

            if(!base64Data) {
                return res.status(400).json({ error: "No se adjuntó archivo PDF base64" });
            }

            const mailOptions = {
                from: '"EPRESEDI S.A.S. - Facturación" <noreply@epresedi.com>',
                to: emailDestino,
                subject: `Factura Electrónica ${factura.id} - EPRESEDI S.A.S.`,
                text: `Estimado(a) ${factura.cliente},\n\nAdjunto enviamos la factura electrónica ${factura.id} correspondiente a sus servicios.\n\nTotal a pagar: $${factura.total}\n\nGracias por su confianza y preferir trabajar con nosotros.`,
                attachments: [
                    {
                        filename: `Factura_${factura.id}.pdf`,
                        path: base64Data // Nodemailer permite dataURIs directamente
                    }
                ]
            };

            const info = await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'Correo enviado a ' + emailDestino, messageId: info.messageId });
        } catch (err) {
            console.error('Error Correo:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = FacturasController;
