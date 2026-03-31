const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
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

    // Helper interno para generar el Buffer del PDF
    static async _generatePDFBuffer(id) {
        const factura = await FacturaModel.getById(id);
        if (!factura) throw new Error("Factura no encontrada");

        // 1. Generar QR base64
        const qrData = `FV: ${factura.id} | Cliente: ${factura.cliente} | Total: $${factura.total}`;
        const qrImage = await QRCode.toDataURL(qrData);

        // 2. Renderizar HTML usando EJS
        const templatePath = path.join(__dirname, '../views/facturaTemplate.ejs');
        const html = await ejs.renderFile(templatePath, {
            factura,
            qrImage,
            logoUrl: 'https://via.placeholder.com/200x60/003366/FFFFFF?text=EPRESEDI+S.A.S.' // placeholder profesional
        });

        // 3. Generar PDF con Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();
        return { pdfBuffer, factura };
    }

    static async downloadPDF(req, res) {
        try {
            const { pdfBuffer, factura } = await FacturasController._generatePDFBuffer(req.params.id);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Factura_${factura.id}.pdf`);
            res.send(pdfBuffer);
        } catch (err) {
            console.error('Error PDF:', err);
            res.status(500).json({ error: err.message });
        }
    }

    static async sendEmail(req, res) {
        try {
            const { pdfBuffer, factura } = await FacturasController._generatePDFBuffer(req.params.id);
            
            // Buscar email del destinatario, si la factura tiene info (o lo pedimos)
            const emailDestino = req.body.correo || 'cliente@ejemplo.com'; 

            const mailOptions = {
                from: '"EPRESEDI S.A.S. - Facturación" <noreply@epresedi.com>',
                to: emailDestino,
                subject: `Factura Electrónica ${factura.id} - EPRESEDI S.A.S.`,
                text: `Estimado(a) ${factura.cliente},\n\nAdjunto enviamos la factura electrónica ${factura.id} correspondiente a sus servicios.\n\nTotal a pagar: $${factura.total}\n\nGracias por su confianza.`,
                attachments: [
                    {
                        filename: `Factura_${factura.id}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
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
