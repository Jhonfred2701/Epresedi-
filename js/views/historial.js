const HistorialView = {
    async renderList() {
        const query = document.getElementById('search-historial')?.value.toLowerCase() || '';
        let facturas = await Store.getFacturas();
        if (query) {
            facturas = facturas.filter(f => 
                f.id.toLowerCase().includes(query) ||
                f.cliente.toLowerCase().includes(query) ||
                (f.nit && f.nit.toLowerCase().includes(query))
            );
        }
        
        const tableBody = facturas.length === 0 
            ? `<tr><td colspan="5" class="px-6 py-6 text-center text-gray-500"><i class="fa-solid fa-folder-open text-3xl mb-3 block text-gray-300"></i> No hay facturas emitidas aún</td></tr>`
            : facturas.map(f => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer" onclick="window.location.hash='#factura/${f.id}'">
                <td class="px-6 py-4 text-sm font-semibold text-brand-600">${f.id}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${formatDate(f.fecha)}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${f.cliente}</td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900 text-right">${formatMoney(f.total)}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-between">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Emitida</span>
                        <button onclick="event.stopPropagation(); HistorialView.delete('${f.id}')" class="text-red-400 hover:text-red-600 transition ml-2" title="Anular Factura">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).reverse().join(''); 

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Historial de Facturación</h2>
                    <p class="text-gray-500 mt-1">Haga clic en una factura para ver el documento</p>
                </div>
                <div class="relative w-full md:w-64">
                    <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                    <input type="text" id="search-historial" value="${query}" onkeyup="HistorialView.renderList()" placeholder="Buscar factura..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-gray-200 text-slate-700">
                                <th class="px-6 py-3 font-semibold text-sm">NO. FACTURA</th>
                                <th class="px-6 py-3 font-semibold text-sm">FECHA</th>
                                <th class="px-6 py-3 font-semibold text-sm">CLIENTE</th>
                                <th class="px-6 py-3 font-semibold text-sm text-right">VALOR TOTAL</th>
                                <th class="px-6 py-3 font-semibold text-sm w-32">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableBody}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.getElementById('view-historial').innerHTML = html;
        
        const searchInput = document.getElementById('search-historial');
        if (searchInput && searchInput.value) {
            searchInput.focus();
        }
    },

    async delete(id) {
        if(confirm('¿Está seguro de anular/eliminar esta factura?')) {
            await Store.deleteFactura(id);
            showToast('Factura eliminada');
            this.renderList();
        }
    },

    async renderFactura(id) {
        const facturas = await Store.getFacturas();
        const f = facturas.find(fac => fac.id === id);
        
        if(!f) {
            window.location.hash = '#historial';
            return;
        }

        const clientes = await Store.getClientes();
        const clienteRecord = clientes.find(c => c.nit === f.nit || c.nombre === f.cliente) || {};
        
        let telefonoFactura = clienteRecord.telefono || 'N/D';
        let correoFactura = clienteRecord.correo || '';
        let direccionFactura = clienteRecord.direccion || '';

        // Intento de fallback a los records históricos antiguos (f.contacto solía tener dirección + correo)
        if (!clienteRecord.id && f.contacto) {
            const parts = f.contacto.split(' ');
            correoFactura = parts.find(s => s.includes('@')) || '';
            direccionFactura = parts.filter(s => !s.includes('@')).join(' ') || '';
        }

        const currentItemsCount = f.items ? f.items.length : 1;
        const totalVentas = formatMoney(f.total);
        const subtotalCalc = f.total / 1.19;
        const ivaCalc = f.total - subtotalCalc;

        // Determine document label based on tipo_documento
        const tipoDoc = f.tipo_documento || 'Factura de venta';
        const isComprobante = tipoDoc.toLowerCase().includes('comprobante') || tipoDoc.toLowerCase().includes('pago electrónico') || tipoDoc.toLowerCase().includes('electrónico');
        const docLabel = isComprobante ? 'Comprobante de Ingreso' : 'Factura Electrónica de Venta';
        const idFacturaDisplay = 'FV2-' + f.id.toString().slice(-4); 

        const html = `
            <div class="mb-4 flex pl-2 print:hidden justify-between items-center w-full max-w-[900px] mx-auto bg-white p-3 rounded shadow-sm border border-gray-100">
                <div class="flex items-center gap-4">
                    <button onclick="window.history.back()" class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-xl">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <h2 class="text-lg font-medium text-gray-800 hidden md:block">${tipoDoc} - ${idFacturaDisplay}</h2>
                </div>
                
                <div class="flex gap-2 text-sm">
                    <button onclick="HistorialView.descargarPDF('${f.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded shadow-sm font-medium flex items-center gap-2 transition">
                        PDF
                    </button>
                    <button onclick="HistorialView.enviarCorreo('${f.id}')" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-1.5 rounded shadow-sm font-medium flex items-center gap-2 transition">
                        <i class="fa-regular fa-envelope"></i> Enviar por Email
                    </button>
                    <button onclick="window.location.hash='#facturar'" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-1.5 rounded shadow-sm font-medium transition hidden md:block">
                        Nueva Factura
                    </button>
                    <button onclick="window.print()" class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 w-10 py-1.5 rounded shadow-sm font-medium transition" title="Impresión Browser">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </div>
            </div>

            <!-- Dashboard de estadísticas rápido -->
            <div class="flex justify-center flex-wrap gap-8 text-sm font-medium text-gray-600 mb-6 print:hidden w-full max-w-[900px] mx-auto bg-gray-50 p-2 rounded-lg">
                <span>Total de productos: <span class="text-gray-900">${currentItemsCount}</span></span>
                <span>Total de ventas: <span class="text-gray-900">${totalVentas}</span></span>
                <span>Clientes: <span class="text-gray-900">1</span></span>
            </div>
            
            <div class="print-view bg-white shadow-md border border-gray-200 w-full max-w-[900px] mx-auto print:shadow-none print:border-none p-10 print:p-0 relative font-sans text-gray-800">
                
                <!-- Encabezado Principal Factura -->
                <div class="flex justify-between items-start mb-6">
                    <!-- Izquierda: Logo y Empresa -->
                    <div class="w-1/2">
                        <img src="img/logo.png" alt="EPRESEDI S.A.S" class="h-24 w-auto object-contain mb-3" onerror="this.src=''; this.className='hidden'; document.getElementById('factura-logo-fallback').classList.remove('hidden');">
                        <div id="factura-logo-fallback" class="hidden w-24 h-24 mb-3 rounded-lg flex items-center justify-center border border-brand-100 text-brand-600">
                           <i class="fa-solid fa-building text-4xl"></i>
                        </div>
                        <div class="text-[11px] leading-tight text-gray-600 space-y-0.5 mt-2 ml-1">
                            <p>Barrio Calazans 1er piso calle 70 # 68A- 11</p>
                            <p>NIT : 900.453.470-7</p>
                            <p>Teléfono : 3218129965</p>
                            <p class="text-blue-600">epresedisas.carepa@gmail.com</p>
                        </div>
                    </div>
                    
                    <!-- Derecha: Datos Factura -->
                    <div class="w-1/2 flex flex-col items-end">
                        <h1 class="text-xl font-medium text-gray-800 mb-4 whitespace-nowrap">${tipoDoc} ${idFacturaDisplay}</h1>
                        
                        <div class="border border-gray-300 w-full max-w-[320px] p-2 text-center text-sm text-gray-800 mb-4 shadow-sm bg-white">
                            ${docLabel}<br>${idFacturaDisplay}
                        </div>

                        <div class="flex w-full max-w-[320px] justify-between text-[11px] text-gray-700">
                            <div class="flex flex-col items-end w-[60%] space-y-2 pr-3">
                                <div class="w-full flex justify-between"><span>Fecha :</span> <span>${formatDate(f.fecha)}</span></div>
                                <div class="w-full flex justify-between"><span>Cajero:</span> <span class="uppercase">Epresedi S.A.S.</span></div>
                                <div class="w-full flex justify-between"><span>Fecha de emisión:</span> <span>${formatDate(f.fecha)}</span></div>
                                <div class="w-full flex justify-between"><span>Fecha de vencimiento:</span> <span>${formatDate(f.fecha)}</span></div>
                            </div>
                            <div class="w-[40%] flex justify-end">
                                <!-- QR CODE PLACEHOLDER GENERADO CON API GRATUITA -->
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Factura%20${idFacturaDisplay}%20EPRESEDI" alt="QR Code" class="h-20 w-20 object-contain ml-2">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bloque de Contacto Cliente (Azul grisáceo) -->
                <div class="bg-[#dce6f2] p-4 text-[12px] mb-6 border border-[#c1d3ec]">
                    <div class="w-full md:w-2/3 grid grid-cols-[100px_1fr] gap-y-1">
                        <span class="font-bold text-gray-800">Nombre:</span>
                        <span class="text-gray-800">${f.cliente}</span>

                        <span class="font-bold text-gray-800">NIT/CC:</span>
                        <span class="text-gray-800">${f.nit || 'N/D'}</span>

                        <span class="font-bold text-gray-800">Teléfono:</span>
                        <span class="text-gray-800">${telefonoFactura}</span>

                        <span class="font-bold text-gray-800">Correo:</span>
                        <span class="text-gray-800">${correoFactura || 'N/D'}</span>

                        <span class="font-bold text-gray-800">Dirección:</span>
                        <span class="text-gray-800">${direccionFactura || 'N/D'}</span>
                    </div>
                </div>

                <!-- Tabla de Productos -->
                <div class="w-full border shadow-sm border-gray-200 mb-6">
                    <table class="w-full text-left text-[12px]">
                        <thead class="bg-[#dce6f2] border-b border-[#c1d3ec]">
                            <tr>
                                <th class="py-2.5 px-3 font-bold text-gray-800 w-[15%]">Código</th>
                                <th class="py-2.5 px-3 font-bold text-gray-800 w-[35%]">Descripción</th>
                                <th class="py-2.5 px-3 font-bold text-gray-800 text-right w-[15%]">Precio</th>
                                <th class="py-2.5 px-3 font-bold text-gray-800 text-center w-[10%]">Cantidad</th>
                                <th class="py-2.5 px-3 font-bold text-gray-800 text-right w-[12%]">Subtotal</th>
                                <th class="py-2.5 px-3 font-bold text-gray-800 text-right w-[13%]">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(f.items || [{codigo: 'SRV-001', descripcion: 'Servicio Anterior', cantidad: 1, valorUnitario: f.total, total: f.total}]).map(item => `
                            <tr class="border-b border-gray-100 last:border-0 bg-[#f8fbfe]">
                                <td class="py-3 px-3 text-gray-700">${item.codigo || '001'}</td>
                                <td class="py-3 px-3 text-gray-800">
                                    <span class="block text-gray-800">${item.descripcion}</span>
                                </td>
                                <td class="py-3 px-3 text-right text-gray-700">${formatMoney(item.valorUnitario)}</td>
                                <td class="py-3 px-3 text-center text-gray-700">${item.cantidad}</td>
                                <td class="py-3 px-3 text-right text-gray-700">${formatMoney(item.total)}</td>
                                <td class="py-3 px-3 text-right text-gray-800">${formatMoney(item.total)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totales (Subtotal / IVA / Total a Pagar) -->
                <div class="flex justify-end pt-2 pb-6">
                    <div class="w-full md:w-1/3 space-y-1.5 text-sm">
                        <div class="flex justify-between items-center px-4">
                            <span class="font-medium text-gray-700">Subtotal:</span>
                            <span class="text-gray-800">${formatMoney(subtotalCalc)}</span>
                        </div>
                        <div class="flex justify-between items-center px-4 border-b border-gray-200 pb-2">
                            <span class="font-medium text-gray-700">IVA (19%):</span>
                            <span class="text-gray-800">${formatMoney(ivaCalc)}</span>
                        </div>
                        <div class="flex justify-between items-center px-4 pt-1">
                            <span class="text-[17px] font-bold text-gray-900">Total a pagar:</span>
                            <span class="text-[17px] font-bold text-gray-900">${formatMoney(f.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="h-20 print:hidden"></div>
        `
        document.getElementById('view-historial').innerHTML = html;
        document.querySelector('aside').classList.add('print:hidden');
    },

    descargarPDF(id) {
        showToast('Generando PDF Profesional, por favor espere...');
        const element = document.querySelector('.print-view');
        html2pdf().set({
            margin:       10,
            filename:     `Factura_EPRESEDI_${id}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
        }).from(element).save();
    },

    async enviarCorreo(id) {
        const email = prompt('¿A qué correo deseas enviar esta factura electrónica?', '');
        if (!email) return;

        showToast('Procesando PDF y enviando correo, un momento por favor...');
        
        try {
            const element = document.querySelector('.print-view');
            const pdfBase64 = await html2pdf().set({
                margin: 10,
                filename: `Factura_EPRESEDI_${id}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            }).from(element).outputPdf('datauristring');

            const req = await fetch('/api/facturas/' + id + '/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email.trim(), fileData: pdfBase64 })
            });
            const res = await req.json();
            if(res.success) {
                showToast('Correo enviado exitosamente a ' + email);
            } else {
                showToast('Error del servidor: ' + (res.error || 'Inválido'), true);
            }
        } catch(e) {
            console.error(e);
            showToast('No se pudo establecer conexión para envío', true);
        }
    }
};
