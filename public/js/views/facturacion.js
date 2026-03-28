const FacturacionView = {
    currentItems: [],
    
    async render() {
        this.currentItems = [];
        const clientes = await Store.getClientes();
        
        const optionsClientes = clientes.map(c => 
            `<option value="${c.id}">${c.nombre} (NIT/CC: ${c.nit})</option>`
        ).join('');

        const productos = await Store.getProductos();
        const optionsProductos = productos.map(p => 
            `<option value="${p.codigo}">${p.nombre}</option>`
        ).join('');

        const html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Nueva Factura</h2>
                <p class="text-gray-500 mt-1">Crea una factura de venta (productos o servicios)</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <form id="form-factura" onsubmit="FacturacionView.save(event)" class="p-8">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Seleccionar Cliente *</label>
                            <select id="f-clienteId" required onchange="FacturacionView.autofillCliente()" class="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition">
                                <option value="" disabled selected>-- Elige un cliente --</option>
                                ${optionsClientes}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Elaboración</label>
                            <input type="date" id="fecha" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mb-8">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                            <input type="text" id="f-cliente-nombre" readonly class="w-full border-0 border-b border-gray-200 px-0 py-2 bg-transparent text-gray-800 font-medium focus:ring-0">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Identificación</label>
                            <input type="text" id="f-cliente-nit" readonly class="w-full border-0 border-b border-gray-200 px-0 py-2 bg-transparent text-gray-800 font-medium focus:ring-0">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dirección / Email</label>
                            <input type="text" id="f-cliente-contacto" readonly class="w-full border-0 border-b border-gray-200 px-0 py-2 bg-transparent text-gray-800 font-medium focus:ring-0">
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Agregar Servicios / Productos</h3>
                    
                    <!-- Agregar Ítem -->
                    <div class="grid grid-cols-12 gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
                        <div class="col-span-12 md:col-span-2">
                            <input type="text" id="item-cod" list="productos-dl" placeholder="Código" oninput="FacturacionView.searchProduct()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase" autocomplete="off">
                            <datalist id="productos-dl">
                                ${optionsProductos}
                            </datalist>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <input type="text" id="item-desc" placeholder="Descripción del servicio" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>
                        <div class="col-span-6 md:col-span-1">
                            <input type="number" id="item-cant" placeholder="1" value="1" min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>
                        <div class="col-span-6 md:col-span-3">
                            <input type="number" id="item-vunit" placeholder="Valor Unitario" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>
                        <div class="col-span-12 md:col-span-2">
                            <button type="button" onclick="FacturacionView.addItem()" class="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition">
                                + Agregar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tabla de Ítems -->
                    <div class="overflow-x-auto mb-8">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
                                    <th class="px-4 py-3 font-semibold text-center w-20">Código</th>
                                    <th class="px-4 py-3 font-semibold w-1/3">Descripción</th>
                                    <th class="px-4 py-3 font-semibold text-center">Cant</th>
                                    <th class="px-4 py-3 font-semibold text-right">Valor Unitario</th>
                                    <th class="px-4 py-3 font-semibold text-right">Valor Total</th>
                                    <th class="px-4 py-3 font-semibold text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody id="tabla-items">
                                <tr><td colspan="5" class="px-4 py-4 text-center text-gray-500 text-sm italic">Agrega ítems a la factura</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="flex justify-between items-center bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <div class="text-sm font-medium text-gray-500">Formas de pago: ACORDAR</div>
                        <div class="text-right">
                            <span class="text-sm text-gray-500 mr-4">Total a Pagar:</span>
                            <span class="text-2xl font-bold text-brand-700" id="f-total-display">$0</span>
                        </div>
                    </div>

                    <div class="mt-8 flex justify-end gap-4">
                        <button type="button" onclick="window.location.hash='#dashboard'" class="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                        <button type="submit" id="btn-guardar" disabled class="px-6 py-2.5 bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                            <i class="fa-solid fa-save"></i> Guardar Factura
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('view-facturar').innerHTML = html;
        this.updateTable();
    },

    async autofillCliente() {
        const id = document.getElementById('f-clienteId').value;
        const clientes = await Store.getClientes();
        const c = clientes.find(x => x.id === id);
        if(c) {
            document.getElementById('f-cliente-nombre').value = c.nombre;
            document.getElementById('f-cliente-nit').value = c.nit;
            document.getElementById('f-cliente-contacto').value = (c.direccion || 'Sin direcc') + ' / ' + (c.correo || 'Sin correo');
            this.checkStatus();
        }
    },

    async searchProduct() {
        const cod = document.getElementById('item-cod').value.trim().toUpperCase();
        if(!cod) return;
        const productos = await Store.getProductos();
        const prod = productos.find(p => p.codigo.toUpperCase() === cod);
        if(prod) {
            document.getElementById('item-desc').value = prod.nombre;
            // Solo damos foco si no estuviera ya escribiendo muy rápido,
            // pero es útil para autocompletar e ir al precio.
            document.getElementById('item-vunit').focus();
        }
    },

    addItem() {
        const cod = document.getElementById('item-cod').value.trim().toUpperCase();
        const desc = document.getElementById('item-desc').value.trim();
        const cant = parseFloat(document.getElementById('item-cant').value);
        const vunit = parseFloat(document.getElementById('item-vunit').value);

        if(!desc || !cant || isNaN(vunit)) {
            showToast('Por favor completa descripción, cantidad y valor', true);
            return;
        }

        this.currentItems.push({
            id: Date.now(),
            codigo: cod,
            descripcion: desc,
            cantidad: cant,
            valorUnitario: vunit,
            total: cant * vunit
        });

        // Limpiar inputs
        document.getElementById('item-cod').value = '';
        document.getElementById('item-desc').value = '';
        document.getElementById('item-cant').value = '1';
        document.getElementById('item-vunit').value = '';

        this.updateTable();
        document.getElementById('item-cod').focus();
    },

    removeItem(id) {
        this.currentItems = this.currentItems.filter(i => i.id !== id);
        this.updateTable();
    },

    updateTable() {
        const tbody = document.getElementById('tabla-items');
        if(this.currentItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500 text-sm italic">Agrega ítems a la factura</td></tr>';
            document.getElementById('f-total-display').textContent = '$0';
            this.checkStatus();
            return;
        }

        tbody.innerHTML = this.currentItems.map(item => `
            <tr class="border-b border-gray-100 border-l-2 border-transparent hover:border-brand-500 transition">
                <td class="px-4 py-3 text-sm text-center text-gray-500 font-mono">${item.codigo || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-800 font-medium">${item.descripcion}</td>
                <td class="px-4 py-3 text-sm text-center text-gray-600">${item.cantidad}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-800">${formatMoney(item.valorUnitario)}</td>
                <td class="px-4 py-3 text-sm text-right text-brand-700 font-bold">${formatMoney(item.total)}</td>
                <td class="px-4 py-3 text-center">
                    <button type="button" onclick="FacturacionView.removeItem(${item.id})" class="text-gray-400 hover:text-red-500 transition" title="Quitar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const totalFactura = this.currentItems.reduce((acc, it) => acc + it.total, 0);
        document.getElementById('f-total-display').textContent = formatMoney(totalFactura);
        this.checkStatus();
    },

    checkStatus() {
        const clienteId = document.getElementById('f-clienteId').value;
        const btn = document.getElementById('btn-guardar');
        if(clienteId && this.currentItems.length > 0) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    },

    async save(event) {
        event.preventDefault();
        
        const clienteId = document.getElementById('f-clienteId').value;
        const clientes = await Store.getClientes();
        const c = clientes.find(x => x.id === clienteId);
        
        const nuevaFactura = await Store.addFactura({
            fecha: document.getElementById('fecha').value,
            clienteId: c.id,
            cliente: c.nombre,
            nit: c.nit,
            contacto: c.direccion,
            items: this.currentItems,
            total: this.currentItems.reduce((acc, it) => acc + it.total, 0),
            estado: 'emitida'
        });

        window.location.hash = `#factura/${nuevaFactura.id}`;
        showToast('¡Factura generada exitosamente!');
    }
};
