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

        const html = `
            <div class="mb-4 flex pl-2 print:hidden justify-between items-center w-full max-w-4xl mx-auto">
                <button onclick="window.history.back()" class="text-brand-600 hover:text-brand-800 font-medium flex items-center gap-2">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
                <div class="flex gap-2">
                    <button onclick="HistorialView.enviarCorreo('${f.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-sm font-medium flex items-center gap-2 transition">
                        <i class="fa-solid fa-envelope"></i> Enviar Correo
                    </button>
                    <button onclick="HistorialView.descargarPDF('${f.id}')" class="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg shadow-sm font-medium flex items-center gap-2 transition">
                        <i class="fa-solid fa-file-pdf"></i> Descargar PDF Profesinal
                    </button>
                    <button onclick="window.print()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm font-medium flex items-center gap-2 transition" title="Impresión Browser">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </div>
            </div>
            
            <div class="print-view bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-4xl mx-auto print:shadow-none print:border-none">
                
                <div class="flex flex-col md:flex-row justify-between items-start border-b-2 border-brand-600 pb-6 mb-6">
                    <div class="flex items-center gap-4">
                        <img src="img/logo.png" alt="EPRESEDI S.A.S" class="h-20 w-auto object-contain" onerror="this.src=''; this.className='hidden'; document.getElementById('factura-logo-fallback').classList.remove('hidden');">
                        <div id="factura-logo-fallback" class="hidden w-20 h-20 bg-brand-50 rounded-lg flex items-center justify-center border border-brand-100 text-brand-600">
                           <i class="fa-solid fa-building text-4xl"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900 tracking-tight">EPRESEDI S.A.S</h2>
                            <p class="text-sm text-gray-500">NIT: 900.453.470-7</p>
                            <p class="text-xs text-gray-500 mt-1">Empresa Prestadora de Servicios Diversos</p>
                            <p class="text-xs text-gray-500">Carepa - Colombia</p>
                        </div>
                    </div>
                    
                    <div class="mt-4 md:mt-0 text-right bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h1 class="text-xl font-bold text-slate-800 uppercase">Factura de Venta</h1>
                        <p class="text-2xl font-bold text-brand-600 tracking-wider">No. ${f.id}</p>
                        
                        <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-left">
                            <span class="text-gray-500 font-medium">Generación:</span>
                            <span class="text-gray-900 font-semibold">${formatDate(f.fecha)}</span>
                            <span class="text-gray-500 font-medium">Vencimiento:</span>
                            <span class="text-gray-900 font-semibold">${formatDate(f.fecha)}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-brand-50/30 p-5 rounded-lg border border-brand-100/50">
                    <div>
                        <p class="text-xs uppercase font-bold text-brand-600 tracking-wider mb-2">Cliente</p>
                        <p class="text-lg font-bold text-gray-900 leading-tight">${f.cliente}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase font-bold text-brand-600 tracking-wider mb-2">Identificación / Contacto</p>
                        <p class="text-md font-semibold text-gray-800 leading-tight">NIT / CC: ${f.nit || 'N/A'}</p>
                        <p class="text-xs text-gray-500 mt-1">${f.contacto || ''}</p>
                    </div>
                </div>

                <table class="w-full text-left border-collapse mb-8">
                    <thead>
                        <tr class="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider border-y border-slate-200">
                            <th class="py-3 px-4 font-semibold w-1/2">Ítem / Descripción</th>
                            <th class="py-3 px-4 font-semibold text-center">Cant.</th>
                            <th class="py-3 px-4 font-semibold text-right">Vlr. Unitario</th>
                            <th class="py-3 px-4 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(f.items || [{descripcion: 'Servicio/Producto Anterior', cantidad: 1, valorUnitario: f.total, total: f.total}]).map(item => `
                        <tr class="border-b border-gray-100">
                            <td class="py-4 px-4">
                                <span class="font-bold text-gray-800 block">${item.descripcion}</span>
                            </td>
                            <td class="py-4 px-4 text-center font-medium">${item.cantidad}</td>
                            <td class="py-4 px-4 text-right text-gray-700">${formatMoney(item.valorUnitario)}</td>
                            <td class="py-4 px-4 text-right font-bold text-gray-900">${formatMoney(item.total)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="flex justify-end pt-4 pb-8">
                    <div class="w-full md:w-1/3 bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-sm font-medium text-gray-500">Subtotal</span>
                            <span class="text-sm font-semibold text-gray-800">${formatMoney(f.total)}</span>
                        </div>
                        <div class="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                            <span class="text-sm font-medium text-gray-500">Impuestos</span>
                            <span class="text-sm font-semibold text-gray-800">$ 0</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-bold text-gray-800">Total Neto</span>
                            <span class="text-2xl font-bold text-brand-600">${formatMoney(f.total)}</span>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-6 mt-8 text-center text-xs text-gray-400">
                    <p class="mb-1">Esta es una representación impresa de la factura de venta.</p>
                    <p>Documento generado por EPRESEDI S.A.S. Sistema Inmobiliario.</p>
                </div>
            </div>
            
            <div class="h-20 print:hidden"></div>
        `;
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
