/**
 * facturasController.js
 * ─────────────────────────────────────────────────────────────────
 * Controlador del módulo de facturas.
 *
 * Endpoints disponibles (registrados en facturasRoutes.js):
 *   GET  /api/facturas               → Listar todas las facturas
 *   POST /api/facturas               → Crear nueva factura (con número automático)
 *   GET  /api/facturas/preview-numero → Previsualizar próximo número por tipo
 *   GET  /api/facturas/:id/pdf       → Redirigir (PDF se genera en frontend)
 *   POST /api/facturas/:id/email     → Enviar factura por correo
 *   DELETE /api/facturas/:id         → Eliminar factura
 * ─────────────────────────────────────────────────────────────────
 */

const nodemailer   = require('nodemailer');
const FacturaModel = require('../models/facturasModel');

// ─── Configuración de correo (Ethereal para pruebas) ─────────────────────────
// En producción se debe reemplazar con las credenciales SMTP reales
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mylene.hegmann58@ethereal.email',
        pass: 'uP6Ry6n5jKp8XZQ8T2'
    }
});

class FacturasController {

    // ─── Listar todas las facturas ────────────────────────────────────────────
    /**
     * GET /api/facturas
     * Retorna el listado completo de facturas con sus ítems.
     */
    static async getAll(req, res) {
        try {
            const facturas = await FacturaModel.getAll();
            res.json(facturas);
        } catch (err) {
            console.error('Error obteniendo facturas:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Previsualizar próximo número de factura ──────────────────────────────
    /**
     * GET /api/facturas/preview-numero?tipo=Canon+de+Arrendamiento
     *
     * Consulta cuál sería el PRÓXIMO número de factura para el tipo indicado,
     * sin modificar ningún contador. Útil para mostrar el número al usuario
     * ANTES de que guarde el documento.
     *
     * Query params:
     *   tipo (string) - Tipo de documento (mismo texto que se envía en tipo_documento)
     *
     * Respuesta: { numero: 'AR-00003', prefijo: 'AR' }
     */
    static async previewNumero(req, res) {
        try {
            // Obtener el tipo de documento desde query string
            const tipo = req.query.tipo || 'Factura de servicios adicionales';

            // Consultar el próximo número sin modificar el contador
            const numero = await FacturaModel.previewNumero(tipo);

            res.json({ numero, prefijo: numero.split('-')[0] });
        } catch (err) {
            console.error('Error generando preview de número:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Crear nueva factura ──────────────────────────────────────────────────
    /**
     * POST /api/facturas
     * Body: { tipo_documento, fecha, clienteId, cliente, nit, contacto,
     *         total, estado, inmuebleId, periodo_facturado, metodo_pago,
     *         referencia_pago, banco_pago, porcentaje_comision, fecha_pago,
     *         items: [{ codigo, descripcion, cantidad, valorUnitario, total }] }
     *
     * El número de factura se genera automáticamente en el modelo.
     * Respuesta: { id, numero_factura, prefijo, consecutivo, ...datos }
     */
    static async create(req, res) {
        try {
            const factura = await FacturaModel.create(req.body);
            res.json(factura);
        } catch (err) {
            console.error('Error creando factura:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Eliminar factura ─────────────────────────────────────────────────────
    /**
     * DELETE /api/facturas/:id
     * Elimina la factura indicada. Los ítems se eliminan en cascada.
     */
    static async delete(req, res) {
        try {
            await FacturaModel.delete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            console.error('Error eliminando factura:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ─── Descargar PDF ────────────────────────────────────────────────────────
    /**
     * GET /api/facturas/:id/pdf
     * El PDF se genera 100% en el frontend con html2pdf.js.
     * Este endpoint solo redirige al historial.
     */
    static async downloadPDF(req, res) {
        res.redirect('/#historial');
    }

    // ─── Enviar factura por correo ────────────────────────────────────────────
    /**
     * POST /api/facturas/:id/email
     * Body: { correo, fileData (PDF en base64 enviado desde el frontend) }
     *
     * Envía la factura como adjunto PDF al correo indicado.
     */
    static async sendEmail(req, res) {
        try {
            const id      = req.params.id;
            const factura = await FacturaModel.getById(id);
            if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

            const emailDestino = req.body.correo   || 'cliente@ejemplo.com';
            const base64Data   = req.body.fileData; // PDF generado por el frontend

            if (!base64Data) {
                return res.status(400).json({ error: 'No se adjuntó archivo PDF base64' });
            }

            // Usar el numero_factura si existe, o el id como fallback
            const numeroFactura = factura.numero_factura || factura.id;

            const mailOptions = {
                from: '"EPRESEDI S.A.S. - Facturación" <noreply@epresedi.com>',
                to: emailDestino,
                subject: `Factura Electrónica ${numeroFactura} - EPRESEDI S.A.S.`,
                text: [
                    `Estimado(a) ${factura.cliente},`,
                    '',
                    `Adjunto enviamos la factura electrónica ${numeroFactura} correspondiente a sus servicios.`,
                    '',
                    `Total a pagar: $${factura.total}`,
                    '',
                    'Gracias por su confianza y preferir trabajar con nosotros.',
                    '',
                    'EPRESEDI S.A.S.'
                ].join('\n'),
                attachments: [
                    {
                        filename: `Factura_${numeroFactura}.pdf`,
                        path: base64Data  // Nodemailer acepta dataURIs base64 directamente
                    }
                ]
            };

            const info = await transporter.sendMail(mailOptions);
            res.json({
                success: true,
                message: `Correo enviado a ${emailDestino}`,
                messageId: info.messageId
            });
        } catch (err) {
            console.error('Error enviando correo:', err);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = FacturasController;
