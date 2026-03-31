const FacturacionView = {
    currentItems: [],
    todosClientes: [],
    todosProductos: [],
    clienteSeleccionado: null,
    
    async render() {
        this.currentItems = [];
        this.clienteSeleccionado = null;
        
        // Cargar datos en memoria para búsquedas instantáneas
        this.todosClientes = await Store.getClientes();
        this.todosProductos = await Store.getProductos();

        const html = `
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Nueva Factura</h2>
                <p class="text-gray-500 mt-1">Crea una factura de venta (productos o servicios)</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <form id="form-factura" onsubmit="FacturacionView.save(event)" class="p-8">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100 relative">
                        
                        <!-- SELECTOR CLIENTE TIPO SIIGO -->
                        <div class="relative w-full z-40" id="contenedor-cliente">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tercero / Cliente *</label>
                            <div class="relative w-full">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fa-solid fa-search text-brand-600"></i>
                                </div>
                                <input type="text" id="ipt-cliente-search" required placeholder="Buscar por nombre o NIT/CC..." onfocus="FacturacionView.showClientesDropdown()" oninput="FacturacionView.filterClientes()" class="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition" autocomplete="off">
                                
                                <!-- Dropdown Flotante Clientes -->
                                <div id="dropdown-clientes" class="absolute left-0 right-0 mt-1 bg-white border border-brand-200 rounded-b-md shadow-2xl hidden flex-col overflow-hidden max-w-full">
                                    <div class="overflow-y-auto w-full max-h-60 bg-white" style="resize: both;">
                                        <table class="w-full text-left text-[12px] md:text-[13px] whitespace-nowrap">
                                            <thead class="bg-slate-100 text-gray-600 font-semibold sticky top-0 shadow-sm">
                                                <tr>
                                                    <th class="px-3 py-2 w-1/2">Nombre completo</th>
                                                    <th class="px-3 py-2 w-1/4">Identificación</th>
                                                    <th class="px-3 py-2 w-1/4">Sucursal</th>
                                                </tr>
                                            </thead>
                                            <tbody id="lista-clientes-tb">
                                            </tbody>
                                        </table>
                                    </div>
                                    <div onclick="FacturacionView.toggleModalClienteFast()" class="bg-brand-600 text-white font-medium text-[13px] px-4 py-2.5 cursor-pointer hover:bg-brand-700 transition flex items-center justify-between">
                                        <span>+ Crear nuevo</span>
                                        <span class="text-xs text-brand-200">Ver más</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Elaboración</label>
                            <input type="date" id="fecha" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <!-- Datos autocompletados (Ocultos o mostrados en linea simple) -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mb-8">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Seleccionado</label>
                            <input type="text" id="f-cliente-nombre" readonly class="w-full border-0 border-b border-gray-200 px-0 py-2 bg-transparent text-gray-800 font-bold focus:ring-0">
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

                    <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detalle Contable / Ítems</h3>
                    
                    <!-- Agregar Ítem -->
                    <div class="grid grid-cols-12 gap-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 relative overflow-visible z-30">
                        
                        <!-- SELECTOR PRODUCTO TIPO SIIGO -->
                        <div class="col-span-12 md:col-span-4 relative" id="contenedor-producto">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fa-solid fa-search text-gray-400 text-xs"></i>
                            </div>
                            <input type="text" id="item-cod-search" placeholder="Cuenta contable / Ítem" onfocus="FacturacionView.showProductosDropdown()" oninput="FacturacionView.filterProductos()" class="w-full border border-gray-300 bg-white rounded-lg pl-8 pr-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none uppercase transition" autocomplete="off">
                            <input type="hidden" id="item-cod-hidden"> <!-- Código real para procesar -->
                            
                            <!-- Dropdown Flotante Productos -->
                            <div id="dropdown-productos" class="absolute left-0 mt-1 min-w-[400px] bg-white border border-brand-200 rounded-b-md shadow-2xl hidden flex-col overflow-hidden max-w-[600px] z-50">
                                <div class="overflow-y-auto w-full max-h-56 bg-white shrink">
                                    <table class="w-full text-left text-[12px] whitespace-nowrap">
                                        <thead class="bg-gray-100 text-gray-600 font-semibold sticky top-0 shadow-sm">
                                            <tr>
                                                <th class="px-3 py-1.5 w-1/6">Código</th>
                                                <th class="px-3 py-1.5 w-3/4">Nombre</th>
                                                <th class="px-3 py-1.5 w-1/6">Categoría</th>
                                            </tr>
                                        </thead>
                                        <tbody id="lista-productos-tb">
                                        </tbody>
                                    </table>
                                </div>
                                <div onclick="FacturacionView.toggleModalProductoFast()" class="bg-brand-600 text-white font-medium text-[13px] px-4 py-2 cursor-pointer hover:bg-brand-700 transition flex items-center justify-between mt-auto">
                                    <span>+ Crear nuevo</span>
                                    <span class="text-xs text-brand-200">Ver más</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-span-12 md:col-span-3">
                            <input type="text" id="item-desc" placeholder="Descripción extendida" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
                        </div>
                        <div class="col-span-6 md:col-span-1">
                            <input type="number" id="item-cant" placeholder="Cant." value="1" min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white text-center">
                        </div>
                        <div class="col-span-6 md:col-span-2">
                            <input type="number" id="item-vunit" placeholder="Valor Ud." min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-semibold">
                        </div>
                        <div class="col-span-12 md:col-span-2 flex items-end">
                            <button type="button" onclick="FacturacionView.addItem()" class="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-2 py-2 text-[13px] font-bold shadow-sm transition flex gap-2 justify-center items-center">
                                <i class="fa-solid fa-check"></i> Agregar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tabla de Ítems -->
                    <div class="overflow-x-auto mb-8 relative z-10">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100 text-slate-700 text-[11px] uppercase tracking-wider font-bold border-b border-gray-200">
                                    <th class="px-4 py-3 text-center w-24">Cuenta/Cód</th>
                                    <th class="px-4 py-3 w-1/3">Descripción</th>
                                    <th class="px-4 py-3 text-center">Cant.</th>
                                    <th class="px-4 py-3 text-right">Crédito / V. Unit.</th>
                                    <th class="px-4 py-3 text-right">Débito / Total</th>
                                    <th class="px-4 py-3 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody id="tabla-items">
                                <tr><td colspan="6" class="px-4 py-6 text-center text-gray-500 text-sm italic border-b border-gray-100">La tabla está vacía. Añade al menos un producto o servicio arriba.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6 gap-4">
                        <div class="w-full md:w-1/2">
                            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</label>
                            <textarea class="w-full h-16 border border-gray-300 rounded bg-white p-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none" placeholder="Ej: Comprobante de los meses de enero, febrero y marzo..."></textarea>
                        </div>
                        <div class="text-right w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 md:border-l border-gray-200 md:pl-6">
                            <span class="text-sm text-gray-500 font-medium mr-4">Total a Pagar (Diferencia: $0):</span>
                            <span class="text-3xl font-bold text-gray-900" id="f-total-display">$ 0</span>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 border-t border-gray-100 pt-6">
                        <button type="button" onclick="window.location.hash='#dashboard'" class="px-6 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm font-bold transition border border-transparent">Cancelar</button>
                        <button type="submit" id="btn-guardar" disabled class="px-8 py-2.5 bg-[#80c342] disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#72b03a] text-white rounded text-sm font-bold shadow transition flex items-center gap-2">
                            Guardar <i class="fa-solid fa-chevron-up text-[10px] ml-1 opacity-80"></i>
                        </button>
                    </div>
                </form>
            </div>

            <!-- MODAL RÁPIDO: CLIENTE -->
            <div id="modal-fast-cliente" class="fixed inset-0 bg-black/60 z-[100] hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-2xl w-full max-w-xl transform transition-all">
                    <div class="flex justify-between items-center p-4 border-b border-gray-100 bg-[#0060d6] text-white rounded-t-lg">
                        <h3 class="text-md font-bold">Creación rápida: Tercero / Cliente</h3>
                        <button onclick="FacturacionView.toggleModalClienteFast()" class="text-blue-100 hover:text-white transition"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>
                    <form id="form-fast-cliente" onsubmit="FacturacionView.saveClienteFast(event)" class="p-5">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Tipo de Persona *</label>
                                <select id="fc-tipo-persona" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm"><option value="Natural">Natural</option><option value="Empresa">Empresa</option></select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre o Razón Social *</label>
                                <input type="text" id="fc-nombre" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm uppercase">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Tipo de Doc *</label>
                                <select id="fc-tipo-doc" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm"><option value="NIT">NIT</option><option value="CC">Cédula</option></select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Número Identificación *</label>
                                <input type="text" id="fc-nit" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Opcional)</label>
                                <input type="email" id="fc-correo" class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm">
                            </div>
                        </div>
                        <div class="mt-5 flex justify-end gap-2 text-sm">
                            <button type="button" onclick="FacturacionView.toggleModalClienteFast()" class="px-4 py-2 text-gray-600 font-medium">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Crear Tercero</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL RÁPIDO: PRODUCTO -->
            <div id="modal-fast-producto" class="fixed inset-0 bg-black/60 z-[100] hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-2xl w-full max-w-sm transform transition-all">
                    <div class="flex justify-between items-center p-4 border-b border-gray-100 bg-[#0060d6] text-white rounded-t-lg">
                        <h3 class="text-md font-bold">Creación rápida: Producto / Servicio</h3>
                        <button onclick="FacturacionView.toggleModalProductoFast()" class="text-blue-100 hover:text-white transition"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>
                    <form id="form-fast-producto" onsubmit="FacturacionView.saveProductoFast(event)" class="p-5">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Código Contable o Ítem *</label>
                                <input type="text" id="fp-codigo" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm uppercase">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Descripción / Nombre *</label>
                                <input type="text" id="fp-nombre" required class="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none text-sm">
                            </div>
                        </div>
                        <div class="mt-5 flex justify-end gap-2 text-sm">
                            <button type="button" onclick="FacturacionView.toggleModalProductoFast()" class="px-4 py-2 text-gray-600 font-medium">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">Añadir Código</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('view-facturar').innerHTML = html;
        this.updateTable();

        // Evento global para cerrar dropdowns si el clic es fuera
        document.addEventListener('click', this.cerrarDropdownsHandler);
    },

    // -------------------------------------------------------------------------
    // EVENTO GLOBAL CLICK AFUERA
    // -------------------------------------------------------------------------
    cerrarDropdownsHandler(e) {
        const dropCl = document.getElementById('dropdown-clientes');
        const contCl = document.getElementById('contenedor-cliente');
        const dropPr = document.getElementById('dropdown-productos');
        const contPr = document.getElementById('contenedor-producto');

        if (dropCl && contCl && !contCl.contains(e.target)) {
            dropCl.classList.add('hidden');
        }
        if (dropPr && contPr && !contPr.contains(e.target)) {
            dropPr.classList.add('hidden');
        }
    },

    // -------------------------------------------------------------------------
    // LÓGICA TERCERO / CLIENTE
    // -------------------------------------------------------------------------
    showClientesDropdown() {
        document.getElementById('dropdown-clientes').classList.remove('hidden');
        this.renderDropdownClientes(this.todosClientes);
        document.getElementById('dropdown-productos').classList.add('hidden'); // Ocultar el otro si estuviese abierto
    },

    filterClientes() {
        const query = document.getElementById('ipt-cliente-search').value.toLowerCase().trim();
        document.getElementById('dropdown-clientes').classList.remove('hidden');
        
        if (!query) {
            this.renderDropdownClientes(this.todosClientes);
            return;
        }

        const filtrados = this.todosClientes.filter(c => 
            c.nombre.toLowerCase().includes(query) ||
            (c.nit && c.nit.toLowerCase().includes(query))
        );
        this.renderDropdownClientes(filtrados);
    },

    renderDropdownClientes(lista) {
        const tbody = document.getElementById('lista-clientes-tb');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="px-3 py-3 text-center text-gray-500 italic">No se encontraron clientes :(</td></tr>`;
            return;
        }
        tbody.innerHTML = lista.map(c => `
            <tr onclick="FacturacionView.selectCliente('${c.id}')" class="hover:bg-brand-50 hover:text-brand-900 cursor-pointer border-b border-gray-50 transition text-gray-700">
                <td class="px-3 py-1.5 truncate max-w-[200px]" title="${c.nombre}">${c.nombre}</td>
                <td class="px-3 py-1.5 font-mono text-xs">${c.nit || 'Sin nit'}</td>
                <td class="px-3 py-1.5 text-xs text-gray-500">0 - Principal</td>
            </tr>
        `).join('');
    },

    selectCliente(id) {
        const c = this.todosClientes.find(x => x.id === id);
        if (!c) return;

        this.clienteSeleccionado = c;
        document.getElementById('ipt-cliente-search').value = c.nombre; // Llenar input principal
        document.getElementById('dropdown-clientes').classList.add('hidden'); 
        
        // Autocompletar el resto (estilo Siigo)
        document.getElementById('f-cliente-nombre').value = c.nombre;
        document.getElementById('f-cliente-nit').value = c.nit;
        document.getElementById('f-cliente-contacto').value = (c.direccion || 'Sin dirección') + ' / ' + (c.correo || 'Sin correo');
        
        this.checkStatus();
        document.getElementById('item-cod-search').focus(); // Saltar al siguiente campo
    },

    // -------------------------------------------------------------------------
    // LÓGICA MODAL CREAR CLIENTE RÁPIDO
    // -------------------------------------------------------------------------
    toggleModalClienteFast() {
        const modal = document.getElementById('modal-fast-cliente');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('dropdown-clientes').classList.add('hidden'); // Ocultar parent dropdown
            document.getElementById('form-fast-cliente').reset();
            const textSearch = document.getElementById('ipt-cliente-search').value;
            if(!/^[0-9]+$/.test(textSearch)) document.getElementById('fc-nombre').value = textSearch.toUpperCase();
            else document.getElementById('fc-nit').value = textSearch;
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async saveClienteFast(e) {
        e.preventDefault();
        const data = {
            tipo_persona: document.getElementById('fc-tipo-persona').value,
            estado: 'Activo',
            nombre: document.getElementById('fc-nombre').value.trim().toUpperCase(),
            tipo_doc: document.getElementById('fc-tipo-doc').value,
            nit: document.getElementById('fc-nit').value.trim(),
            correo: document.getElementById('fc-correo').value.trim(),
            fecha_registro: new Date().toISOString().split('T')[0]
        };

        const nuevo = await Store.addCliente(data);
        showToast('Tercero guardado exitosamente');
        
        // Actualizar array local, seleccionar al nuevo cliente, y cerrar modal
        this.todosClientes.push(nuevo);
        this.toggleModalClienteFast();
        this.selectCliente(nuevo.id);
    },

    // -------------------------------------------------------------------------
    // LÓGICA CUENTA/CÓDIGO (PRODUCTOS)
    // -------------------------------------------------------------------------
    showProductosDropdown() {
        document.getElementById('dropdown-productos').classList.remove('hidden');
        this.renderDropdownProductos(this.todosProductos);
        document.getElementById('dropdown-clientes').classList.add('hidden'); 
    },

    filterProductos() {
        const query = document.getElementById('item-cod-search').value.toLowerCase().trim();
        document.getElementById('dropdown-productos').classList.remove('hidden');
        
        if (!query) {
            this.renderDropdownProductos(this.todosProductos);
            return;
        }

        const filtrados = this.todosProductos.filter(p => 
            p.nombre.toLowerCase().includes(query) ||
            p.codigo.toLowerCase().includes(query)
        );
        this.renderDropdownProductos(filtrados);
    },

    renderDropdownProductos(lista) {
        const tbody = document.getElementById('lista-productos-tb');
        if (!lista || lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="px-3 py-3 text-center text-gray-500 italic">No se encontraron cuentas o servicios</td></tr>`;
            return;
        }
        tbody.innerHTML = lista.map(p => `
            <tr onclick="FacturacionView.selectProducto('${p.codigo}')" class="hover:bg-brand-50 hover:text-brand-900 cursor-pointer border-b border-gray-50 transition text-gray-700 text-sm">
                <td class="px-3 py-1.5 font-mono text-xs text-gray-500">${p.codigo}</td>
                <td class="px-3 py-1.5 font-medium truncate max-w-[250px]" title="${p.nombre}">${p.nombre}</td>
                <td class="px-3 py-1.5 text-xs text-gray-400">Servicios / Prod</td>
            </tr>
        `).join('');
    },

    selectProducto(cod) {
        const p = this.todosProductos.find(x => x.codigo === cod);
        if (!p) return;

        document.getElementById('item-cod-hidden').value = p.codigo;
        document.getElementById('item-cod-search').value = p.codigo;
        document.getElementById('item-desc').value = p.nombre;
        
        document.getElementById('dropdown-productos').classList.add('hidden');
        document.getElementById('item-cant').focus(); // Saltar al precio o cant.
    },

    // -------------------------------------------------------------------------
    // LÓGICA MODAL CREAR PRODUCTO RÁPIDO
    // -------------------------------------------------------------------------
    toggleModalProductoFast() {
        const modal = document.getElementById('modal-fast-producto');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('dropdown-productos').classList.add('hidden'); 
            document.getElementById('form-fast-producto').reset();
            const txt = document.getElementById('item-cod-search').value.toUpperCase();
            document.getElementById('fp-codigo').value = txt.length < 10 ? txt : Math.floor(Math.random()*90000)+10000;
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async saveProductoFast(e) {
        e.preventDefault();
        const data = {
            codigo: document.getElementById('fp-codigo').value.trim().toUpperCase(),
            nombre: document.getElementById('fp-nombre').value.trim()
        };
        
        // Evitar duplicados
        const ext = this.todosProductos.find(p => p.codigo === data.codigo);
        if(ext) {
            showToast('Ese código de cuenta contable ya existe', true);
            return;
        }

        const nuevo = await Store.addProducto(data);
        showToast('Código guardado correctamente');
        
        this.todosProductos.push(nuevo);
        this.toggleModalProductoFast();
        this.selectProducto(nuevo.codigo);
    },

    // -------------------------------------------------------------------------
    // GESTIÓN DE LA TABLA Y FACTURA
    // -------------------------------------------------------------------------
    addItem() {
        const cod = document.getElementById('item-cod-hidden').value.trim() || document.getElementById('item-cod-search').value.trim().toUpperCase();
        const desc = document.getElementById('item-desc').value.trim();
        const cant = parseFloat(document.getElementById('item-cant').value);
        const vunit = parseFloat(document.getElementById('item-vunit').value);

        if(!cod || !desc || !cant || isNaN(vunit)) {
            showToast('Por favor completa cuenta, descripción, cantidad y valor', true);
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
        document.getElementById('item-cod-search').value = '';
        document.getElementById('item-cod-hidden').value = '';
        document.getElementById('item-desc').value = '';
        document.getElementById('item-cant').value = '1';
        document.getElementById('item-vunit').value = '';

        this.updateTable();
        document.getElementById('item-cod-search').focus();
    },

    removeItem(id) {
        this.currentItems = this.currentItems.filter(i => i.id !== id);
        this.updateTable();
    },

    updateTable() {
        const tbody = document.getElementById('tabla-items');
        if(this.currentItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center text-gray-500 text-sm italic border-b border-gray-100">La tabla está vacía. Añade al menos un producto o servicio arriba.</td></tr>';
            document.getElementById('f-total-display').textContent = '$ 0';
            this.checkStatus();
            return;
        }

        tbody.innerHTML = this.currentItems.map(item => `
            <tr class="border-b border-gray-100 hover:bg-green-50/20 transition group">
                <td class="px-4 py-3 text-xs text-center text-gray-500 font-mono">${item.codigo}</td>
                <td class="px-4 py-3 text-xs text-gray-800 font-medium">${item.descripcion}</td>
                <td class="px-4 py-3 text-xs text-center text-gray-600">${item.cantidad}</td>
                <td class="px-4 py-3 text-xs text-right text-gray-600">${formatMoney(item.valorUnitario)}</td>
                <td class="px-4 py-3 text-[13px] text-right text-gray-900 font-bold">${formatMoney(item.total)}</td>
                <td class="px-4 py-3 text-center">
                    <button type="button" onclick="FacturacionView.removeItem(${item.id})" class="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100" title="Quitar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const totalFactura = this.currentItems.reduce((acc, it) => acc + it.total, 0);
        document.getElementById('f-total-display').textContent = formatMoney(totalFactura);
        this.checkStatus();
    },

    checkStatus() {
        const btn = document.getElementById('btn-guardar');
        if(this.clienteSeleccionado && this.currentItems.length > 0) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    },

    async save(event) {
        event.preventDefault();
        
        if(!this.clienteSeleccionado) {
            showToast('Por favor selecciona un cliente de la lista.', true);
            return;
        }

        const nuevaFactura = await Store.addFactura({
            fecha: document.getElementById('fecha').value,
            clienteId: this.clienteSeleccionado.id,
            cliente: this.clienteSeleccionado.nombre,
            nit: this.clienteSeleccionado.nit,
            contacto: (this.clienteSeleccionado.direccion || '') + ' ' + (this.clienteSeleccionado.correo || ''),
            items: this.currentItems,
            total: this.currentItems.reduce((acc, it) => acc + it.total, 0),
            estado: 'emitida',
            observaciones: document.querySelector('textarea').value.trim()
        });

        window.location.hash = `#factura/${nuevaFactura.id}`;
        showToast('¡Factura o Comprobante generado exitosamente!');
    }
};
