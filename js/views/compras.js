/**
 * compras.js
 * Módulo de la vista de Compras de Mercancía.
 */

const ComprasView = {
    compras: [],
    proveedores: [],
    productos: [],
    carrito: [], // Almacena temporalmente los items a comprar

    async render() {
        const container = document.getElementById('view-compras');
        container.innerHTML = `
            <!-- Panel Principal -->
            <div id="compras-panel-main">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
                            <i class="fa-solid fa-cart-shopping text-brand-600"></i> Historial de Compras
                        </h2>
                        <p class="text-sm text-gray-500 mt-1 font-medium">Registro de entradas de inventario y compras a proveedores</p>
                    </div>
                    <button onclick="ComprasView.showPlataforma()" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-brand-500/30 flex items-center gap-2 transition hover:-translate-y-0.5">
                        <i class="fa-solid fa-plus"></i> Registrar Nueva Compra
                    </button>
                </div>

                <!-- Tabla de Historial -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse whitespace-nowrap">
                            <thead class="bg-slate-50 border-b-2 border-slate-200">
                                <tr>
                                    <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">ID / FECHA</th>
                                    <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">PROVEEDOR</th>
                                    <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest text-right">TOTAL PAGADO</th>
                                    <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest text-center">DETALLES</th>
                                </tr>
                            </thead>
                            <tbody id="compras-table-body" class="divide-y divide-gray-100">
                                <!-- Contenido dinámico -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Plataforma de Nueva Compra (Oculta por defecto) -->
            <div id="compras-panel-create" class="hidden">
                 <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-file-invoice text-brand-600"></i> Nueva Entrada de Inventario
                    </h2>
                    <button onclick="ComprasView.hidePlataforma()" class="text-gray-500 hover:text-gray-800 font-bold px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <i class="fa-solid fa-arrow-left"></i> Volver
                    </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Columna Izquierda: Detalles Proveedor y Producto -->
                    <div class="lg:col-span-1 space-y-6">
                        <!-- Card Proveedor -->
                        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 class="text-sm font-black text-gray-700 uppercase mb-3 flex items-center gap-2"><i class="fa-solid fa-truck-fast"></i> Datos del Proveedor</h4>
                            <select id="compra-proveedor" class="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-brand-500 focus:outline-none font-medium cursor-pointer">
                                <!-- Options -->
                            </select>
                        </div>

                        <!-- Card Búsqueda de Productos -->
                        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 class="text-sm font-black text-gray-700 uppercase mb-3 flex items-center gap-2"><i class="fa-solid fa-box"></i> Agregar Producto</h4>
                            
                            <select id="compra-producto" class="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-brand-500 focus:outline-none font-medium mb-4">
                                <option value="">-- Seleccionar Producto --</option>
                            </select>

                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-500 mb-1">Cantidad</label>
                                    <input type="number" id="compra-cantidad" min="1" value="1" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-brand-500 font-bold text-center">
                                </div>
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-500 mb-1">Precio Compra ($)</label>
                                    <input type="number" id="compra-precio" min="0" value="0" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-right focus:border-brand-500 font-bold">
                                </div>
                            </div>

                            <button onclick="ComprasView.agregarAlCarrito()" class="w-full bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white transition rounded-lg py-2.5 font-bold flex items-center justify-center gap-2">
                                <i class="fa-solid fa-cart-plus"></i> Añadir a la Lista
                            </button>
                        </div>
                    </div>

                    <!-- Columna Derecha: Canasta -->
                    <div class="lg:col-span-2">
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div class="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                                <h3 class="font-black text-lg text-gray-800">Cesta de Compra</h3>
                                <div class="text-sm font-bold text-gray-500"><span id="cart-qty">0</span> ítem(s)</div>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[300px]" id="cart-container">
                                <!-- Carrito Visual -->
                            </div>

                            <div class="p-5 border-t border-gray-200 bg-white">
                                <div class="flex justify-between items-end mb-4">
                                    <span class="text-gray-500 font-bold uppercase tracking-widest text-sm">TOTAL A PAGAR</span>
                                    <span class="text-3xl font-black text-emerald-600 tracking-tight" id="cart-total">$0.00</span>
                                </div>
                                <button onclick="ComprasView.guardarCompra()" class="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 text-white transition py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-lg">
                                    <i class="fa-solid fa-check-double"></i> Confirmar Transacción e Ingresar Stock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Ver Detalle Compra -->
            <div id="modal-detalle-compra" class="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 hidden flex-col items-center justify-center p-4 backdrop-blur-sm transition-all">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform relative border border-gray-200">
                    <button onclick="document.getElementById('modal-detalle-compra').classList.add('hidden'); document.getElementById('modal-detalle-compra').classList.remove('flex');" class="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition w-9 h-9 flex items-center justify-center z-10"><i class="fa-solid fa-xmark text-lg"></i></button>
                    
                    <div class="px-6 py-6 border-b border-gray-200 bg-slate-50">
                        <h3 class="text-xl font-black text-gray-900" id="mdc-id">COMP-000000</h3>
                        <p class="text-sm text-gray-500 flex justify-between mt-2">
                            <span id="mdc-fecha">20XX-XX-XX</span>
                            <span id="mdc-prov" class="font-bold text-brand-600">Proveedor S.A.S</span>
                        </p>
                    </div>

                    <div class="p-0 bg-white max-h-[60vh] overflow-y-auto">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 font-black text-gray-500">CÓDIGO - PRODUCTO</th>
                                    <th class="px-4 py-3 font-black text-gray-500 text-center">CANT.</th>
                                    <th class="px-4 py-3 font-black text-gray-500 text-right">PRECIO/U</th>
                                    <th class="px-4 py-3 font-black text-gray-500 text-right">SUBTOTAL</th>
                                </tr>
                            </thead>
                            <tbody id="mdc-items" class="divide-y divide-gray-100">
                            </tbody>
                        </table>
                    </div>
                    <div class="p-4 bg-emerald-50 border-t border-emerald-100 flex justify-between">
                        <span class="font-black text-emerald-800">TOTAL PAGADO</span>
                        <span class="font-black text-emerald-700 text-xl" id="mdc-total">$0</span>
                    </div>
                </div>
            </div>
        `;
        await this.loadData();
    },

    async loadData() {
        try {
            const [compras, provs, prods] = await Promise.all([
                Store.getCompras(),
                Store.getProveedores(),
                Store.getProductos()
            ]);
            
            this.compras = compras;
            this.proveedores = provs;
            this.productos = prods;
            
            this.renderHistorial();
        } catch(e) {
            console.error(e);
            showToast("Error al cargar módulo de compras", true);
        }
    },

    renderHistorial() {
        const tbody = document.getElementById('compras-table-body');
        if (!tbody) return;

        if (this.compras.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500"><i class="fa-solid fa-box-open text-4xl mb-3 opacity-50"></i><p>Aún no has registrado ninguna compra de inventario</p></td></tr>`;
            return;
        }

        tbody.innerHTML = this.compras.map(c => `
            <tr class="hover:bg-brand-50/50 transition border-b border-gray-50">
                <td class="px-6 py-4">
                    <div class="font-bold font-mono text-gray-800 text-sm">${c.id}</div>
                    <div class="text-xs text-gray-500">${c.fecha_compra}</div>
                </td>
                <td class="px-6 py-4 font-medium text-brand-700 text-sm">
                    ${c.proveedor_nombre || 'Proveedor Desconocido'}
                </td>
                <td class="px-6 py-4 text-right font-black text-emerald-700 text-sm">
                    ${formatMoney(c.total_compra)}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="ComprasView.verDetalle('${c.id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `).join('');
    },

    showPlataforma() {
        document.getElementById('compras-panel-main').classList.add('hidden');
        document.getElementById('compras-panel-create').classList.remove('hidden');

        // Cargar Comboboxes
        const selProv = document.getElementById('compra-proveedor');
        selProv.innerHTML = this.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

        const selProd = document.getElementById('compra-producto');
        selProd.innerHTML = '<option value="">-- Seleccionar Producto --</option>' + 
                            this.productos.map(p => `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`).join('');
        
        // Setup Inicial si se selecciona producto cambiar el PRECIO base
        selProd.onchange = () => {
            const v = selProd.value;
            if(!v) return;
            const pd = this.productos.find(x => x.id === v);
            if(pd) document.getElementById('compra-precio').value = pd.precio_compra || 0;
        };

        this.carrito = [];
        this.renderCarrito();
    },

    hidePlataforma() {
        document.getElementById('compras-panel-create').classList.add('hidden');
        document.getElementById('compras-panel-main').classList.remove('hidden');
        this.renderHistorial();
    },

    agregarAlCarrito() {
        const prodId = document.getElementById('compra-producto').value;
        const qty = parseInt(document.getElementById('compra-cantidad').value);
        const price = parseFloat(document.getElementById('compra-precio').value);

        if(!prodId) {
            showToast("Por favor selecciona un producto válido", true);
            return;
        }
        if(isNaN(qty) || qty <= 0) {
            showToast("La cantidad debe ser mayor a 0", true);
            return;
        }
        if(isNaN(price) || price < 0) {
            showToast("Precio inválido", true);
            return;
        }

        const productoInfo = this.productos.find(p => p.id === prodId);

        // Validar si ya está en carrito (sumar cantidades en lugar de hacer linea nueva)
        const existeIdx = this.carrito.findIndex(c => c.id_producto === prodId);
        if(existeIdx >= 0) {
            this.carrito[existeIdx].cantidad += qty;
            // opcional: promediar o reescribir precio si cambió. Asumiremos reescribir con el ultimo tipeado.
            this.carrito[existeIdx].precio_compra = price;
            this.carrito[existeIdx].subtotal = this.carrito[existeIdx].cantidad * price;
        } else {
            this.carrito.push({
                id_producto: prodId,
                codigo: productoInfo.codigo,
                nombre: productoInfo.nombre,
                cantidad: qty,
                precio_compra: price,
                subtotal: qty * price
            });
        }
        
        showToast("✓ Producto añadido a la lista");
        // reset fields
        document.getElementById('compra-cantidad').value = 1;
        document.getElementById('compra-producto').value = '';
        
        this.renderCarrito();
    },

    quitarDelCarrito(index) {
        this.carrito.splice(index, 1);
        this.renderCarrito();
    },

    renderCarrito() {
        const container = document.getElementById('cart-container');
        document.getElementById('cart-qty').innerText = this.carrito.length;

        if(this.carrito.length === 0) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-400 mt-10"><i class="fa-solid fa-basket-shopping text-4xl mb-2"></i><p>Tu cesta de compras está vacía.</p></div>`;
            document.getElementById('cart-total').innerText = '$0.00';
            return;
        }

        let gran_total = 0;
        
        container.innerHTML = `<div class="space-y-3">` + this.carrito.map((c, i) => {
            gran_total += c.subtotal;
            return `
                <div class="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between group">
                    <div class="flex-1">
                        <div class="font-bold text-gray-800 text-sm">${c.codigo} - ${c.nombre}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            Cant: <span class="font-bold text-brand-600">${c.cantidad}</span> x <span class="font-mono">${formatMoney(c.precio_compra)}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-black text-gray-900">${formatMoney(c.subtotal)}</div>
                        <button onclick="ComprasView.quitarDelCarrito(${i})" class="text-red-400 hover:text-red-600 text-xs mt-1 font-bold underline transition opacity-0 group-hover:opacity-100">Quitar</button>
                    </div>
                </div>
            `;
        }).join('') + `</div>`;

        document.getElementById('cart-total').innerText = formatMoney(gran_total);
    },

    async guardarCompra() {
        if(this.carrito.length === 0) {
            showToast("Añade al menos un producto a la canasta", true);
            return;
        }
        const provId = document.getElementById('compra-proveedor').value;
        if(!provId) {
            showToast("Selecciona el proveedor al que compras", true);
            return;
        }

        const data = {
            id_proveedor: provId,
            items: this.carrito.map(c => ({
                id_producto: c.id_producto,
                cantidad: c.cantidad,
                precio_compra: c.precio_compra
            }))
        };

        if(!confirm("¿Deseas confirmar la compra?\nEsto actualizará automáticamente el STOCK sumando estas cantidades, y se registrará permanentemente.")) return;

        try {
            await Store.addCompra(data);
            showToast("✅ Compra y Entrada de Stock realizada exitosamente");
            
            // Refrescar data central
            await this.loadData();
            this.hidePlataforma();
            
        } catch(e) {
            console.error(e);
            showToast(e.message || "Error registrando la compra", true);
        }
    },

    async verDetalle(id) {
        try {
            const data = await Store.getCompraById(id);
            if(!data) {
                showToast("No se pudo cargar el detalle", true);
                return;
            }

            document.getElementById('mdc-id').innerText = data.id;
            document.getElementById('mdc-fecha').innerText = data.fecha_compra;
            document.getElementById('mdc-prov').innerText = data.proveedor_nombre || 'No Asociado';
            document.getElementById('mdc-total').innerText = formatMoney(data.total_compra);

            const tbody = document.getElementById('mdc-items');
            tbody.innerHTML = data.items.map(i => `
                <tr>
                    <td class="px-4 py-3"><div class="font-bold text-gray-800">${i.codigo}</div><div class="text-xs text-gray-500">${i.producto_nombre}</div></td>
                    <td class="px-4 py-3 text-center font-black">${i.cantidad}</td>
                    <td class="px-4 py-3 text-right font-mono text-gray-600">${formatMoney(i.precio_compra)}</td>
                    <td class="px-4 py-3 text-right font-bold text-emerald-600">${formatMoney(i.subtotal)}</td>
                </tr>
            `).join('');

            const modal = document.getElementById('modal-detalle-compra');
            modal.classList.remove('hidden');
            modal.classList.add('flex');

        } catch(e) {
            showToast("Hubo un error de conexión", true);
        }
    }
};
