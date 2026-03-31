const ProductosView = {
    categorias: [],
    proveedores: [],
    productos: [],

    async render() {
        const query = document.getElementById('search-productos')?.value.toLowerCase() || '';
        
        // Cargar todo en paralelo usando la Store
        const [cats, provs, prods] = await Promise.all([
            Store.getCategorias(),
            Store.getProveedores(),
            Store.getProductos()
        ]);
        
        this.categorias = cats;
        this.proveedores = provs;
        this.productos = prods;
        let productos = prods;

        // Buscador en tiempo real por código o nombre
        if (query) {
            productos = productos.filter(p => 
                p.nombre.toLowerCase().includes(query) ||
                p.codigo.toLowerCase().includes(query)
            );
        }
        
        const tableBody = productos.length === 0 
            ? `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500 bg-white"><div class="flex flex-col items-center justify-center"><i class="fa-solid fa-box-open text-5xl mb-4 text-gray-200"></i><p class="text-lg">No se encontraron productos registrados</p><p class="text-sm">Agrega el primer producto haciendo clic en 'Nuevo'</p></div></td></tr>`
            : productos.map(p => {
                // Determine stock pill style (verde normal, ámbar bajo, rojo crítico)
                let stockClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                if(p.stock < 10) stockClass = "bg-rose-100 text-rose-800 border-rose-200 font-bold animate-pulse";
                else if(p.stock < 30) stockClass = "bg-amber-100 text-amber-800 border-amber-200";

                return `
            <tr class="border-b border-gray-100 hover:bg-brand-50 transition duration-150">
                <td class="px-6 py-4.5 text-sm font-bold font-mono text-brand-700 w-32 cursor-pointer hover:underline" onclick="ProductosView.viewDetails('${p.id}')"><i class="fa-solid fa-barcode text-gray-400 text-xs mr-1 hidden sm:inline"></i> ${p.codigo}</td>
                <td class="px-6 py-4.5 text-sm font-semibold text-gray-800">${p.nombre}</td>
                <td class="px-6 py-4.5 text-xs text-gray-600 font-medium"><span class="bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 shadow-sm"><i class="fa-solid fa-tag text-[10px] text-gray-400 mr-1"></i> ${p.categoria_nombre || 'Sin Categ.'}</span></td>
                <td class="px-6 py-4.5 text-sm font-black text-green-700">${formatMoney(p.precio_venta)}</td>
                <td class="px-6 py-4.5 text-sm text-center">
                    <span class="px-3.5 py-1.5 rounded-full text-xs border ${stockClass} shadow-sm">${p.stock} uds</span>
                </td>
                <td class="px-6 py-4.5 text-sm text-right align-middle">
                    <button onclick="ProductosView.edit('${p.id}')" class="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 w-9 h-9 rounded-lg transition shadow-sm mr-1.5 text-center" title="Editar Producto">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="ProductosView.delete('${p.id}')" class="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-100 w-9 h-9 rounded-lg transition shadow-sm text-center" title="Eliminar Permanentemente">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
            `}).join('');

        // Generar options HTML para los dropdowns del Modal
        const optionsCat = this.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
        const optionsProv = this.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 tracking-tight">Inventario de Productos</h2>
                    <p class="text-gray-500 mt-1 font-medium text-sm">Administración central de stock, categorías y listado de precios</p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-80 shadow-sm rounded-lg group">
                        <i class="fa-solid fa-search absolute left-4 top-3 text-gray-400 group-focus-within:text-brand-500 transition"></i>
                        <input type="text" id="search-productos" value="${query}" onkeyup="ProductosView.render()" placeholder="Filtrar por código o palabras..." class="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none transition shadow-inner bg-gray-50 focus:bg-white text-sm">
                    </div>
                    <button onclick="ProductosView.toggleModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-brand-500/30 flex items-center gap-2 transition hover:-translate-y-0.5 whitespace-nowrap text-sm">
                        <i class="fa-solid fa-circle-plus"></i> Crear Nuevo
                    </button>
                </div>
            </div>

            <!-- TABLA PRINCIPAL STYLED (BOOTSTRAP-LIKE / ADMINLTE-LIKE WITH TAILWIND) -->
            <div class="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-200 overflow-hidden max-w-full">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead class="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">CÓDIGO</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">PRODUCTO</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">CATEGORÍA</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">PRECIO VENTA</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest text-center">STOCK (CANTIDAD)</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${tableBody}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL CRUD (Creación / Edición) -->
            <div id="modal-producto" class="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 hidden flex-col items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-all">
                <div class="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-3xl overflow-hidden transform flex flex-col max-h-[92vh] border border-gray-100">
                    <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
                        <h3 class="text-2xl font-black text-gray-800 flex items-center gap-3"><span class="bg-brand-100 text-brand-600 p-2 rounded-xl text-xl shadow-sm"><i class="fa-solid fa-boxes-packing"></i></span> <span id="modal-producto-title">Ficha de Producto</span></h3>
                        <button onclick="ProductosView.toggleModal()" class="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition duration-200 focus:outline-none">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="form-producto" onsubmit="ProductosView.save(event)" class="p-6 md:p-8 overflow-y-auto bg-[#fafbfc]">
                        <input type="hidden" id="prod-id">
                        
                        <!-- Bloque 1: Info Básica -->
                        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
                            <div class="w-1 h-full bg-brand-500 absolute left-0 top-0"></div>
                            <h4 class="text-sm font-black text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2"><i class="fa-solid fa-circle-info"></i> Información Principal</h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Código UUID / SKU *</label>
                                    <div class="relative">
                                        <i class="fa-solid fa-barcode absolute left-3 top-3.5 text-gray-400"></i>
                                        <input type="text" id="prod-codigo" required placeholder="Ej: LENOVO-T490" class="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-brand-500 focus:ring-0 focus:outline-none uppercase font-mono font-bold text-gray-800 bg-gray-50 transition">
                                    </div>
                                    <p class="text-[10px] text-gray-400 mt-1 ml-1" id="hint-codigo">El código es inmutable. No se permite duplicar.</p>
                                </div>
                                <div class="md:col-span-1">
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Nombre o Descripción Exacta *</label>
                                    <input type="text" id="prod-nombre" required placeholder="Ej: Computador Portátil Lenovo 8GB RAM" class="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-brand-500 focus:ring-0 focus:outline-none font-semibold text-gray-800 transition">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Clasificación / Categoría</label>
                                    <select id="prod-categoria" class="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-brand-500 focus:ring-0 focus:outline-none font-medium text-gray-700 bg-white transition appearance-none cursor-pointer hover:border-gray-300">
                                        ${optionsCat}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Proveedor Primario</label>
                                    <select id="prod-proveedor" class="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-brand-500 focus:ring-0 focus:outline-none font-medium text-gray-700 bg-white transition appearance-none cursor-pointer hover:border-gray-300">
                                        ${optionsProv}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Bloque 2: Finanzas y Stock -->
                        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div class="w-1 h-full bg-emerald-500 absolute left-0 top-0"></div>
                            <h4 class="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><i class="fa-solid fa-money-bill-trend-up"></i> Finanzas de Inventario</h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Cantidad Stock</label>
                                    <div class="relative group">
                                        <i class="fa-solid fa-cubes-stacked absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-500 transition"></i>
                                        <input type="number" id="prod-stock" value="0" min="0" class="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:border-brand-500 focus:ring-0 focus:outline-none font-black text-xl text-gray-800 transition">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Costo Base (Compra)</label>
                                    <div class="relative group">
                                        <span class="absolute left-3 top-2.5 text-gray-500 font-bold text-lg group-focus-within:text-blue-500 transition">$</span>
                                        <input type="number" id="prod-precio-compra" value="0" min="0" step="0.01" class="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-2.5 focus:border-blue-500 focus:ring-0 focus:outline-none font-bold text-gray-700 transition">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Precio Final (Venta)</label>
                                    <div class="relative group">
                                        <span class="absolute left-3 top-2.5 text-gray-500 font-bold text-lg group-focus-within:text-green-500 transition">$</span>
                                        <input type="number" id="prod-precio-venta" value="0" min="0" step="0.01" class="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-2.5 focus:border-green-500 focus:ring-0 focus:outline-none font-black text-xl text-green-700 bg-green-50 transition border-green-200">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer Formularios -->
                        <div class="mt-8 flex justify-end gap-3 pt-5 border-t border-gray-200">
                            <button type="button" onclick="ProductosView.toggleModal()" class="px-6 py-3 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-bold transition shadow-sm text-sm">Descartar Cambios</button>
                            <button type="submit" class="px-6 py-3 bg-brand-600 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/40 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 text-sm"><i class="fa-solid fa-cloud-arrow-up"></i> Guardar en BD</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal Detalles (Visualización Read-Only) -->
            <div id="modal-detalles" class="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 hidden flex-col items-center justify-center p-4 backdrop-blur-sm transition-all">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform relative border border-gray-200">
                    <button onclick="document.getElementById('modal-detalles').classList.add('hidden'); document.getElementById('modal-detalles').classList.remove('flex');" class="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition w-9 h-9 flex items-center justify-center z-10"><i class="fa-solid fa-xmark text-lg"></i></button>
                    
                    <div class="px-6 py-8 text-center bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200">
                        <div class="w-24 h-24 bg-white text-brand-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg border border-gray-100 relative">
                            <i class="fa-solid fa-box-open"></i>
                            <span id="det-pill" class="absolute -bottom-2 -right-4 bg-green-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-sm">STOCK OK</span>
                        </div>
                        <h3 class="text-xl font-black text-gray-900 leading-tight mb-1" id="det-nombre">Nombre del Producto</h3>
                        <p class="text-brand-600 font-mono font-bold tracking-widest text-sm bg-brand-50 inline-block px-3 py-1 rounded-md" id="det-codigo">COD-000</p>
                    </div>

                    <div class="p-0 bg-white">
                        <ul class="text-sm divide-y divide-gray-100">
                            <li class="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50 transition"><span class="text-gray-500"><i class="fa-solid fa-tags w-4 text-center mr-2 opacity-50"></i>Familia</span> <span class="font-bold text-gray-800 text-right" id="det-cat">Cat</span></li>
                            <li class="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50 transition"><span class="text-gray-500"><i class="fa-solid fa-truck w-4 text-center mr-2 opacity-50"></i>Distribuidor</span> <span class="font-bold text-gray-800 text-right truncate pl-4" id="det-prov">Prov</span></li>
                            <li class="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50 transition"><span class="text-gray-500"><i class="fa-solid fa-cubes w-4 text-center mr-2 opacity-50"></i>Existencias Físicas</span> <span class="font-black text-lg" id="det-stock">0</span></li>
                            <li class="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50 transition"><span class="text-gray-500"><i class="fa-solid fa-money-check w-4 text-center mr-2 opacity-50"></i>Valor Compra/Costo</span> <span class="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100" id="det-compra">$0</span></li>
                            <li class="flex justify-between items-center px-6 py-4 bg-emerald-50"><span class="text-emerald-800 font-bold uppercase text-xs"><i class="fa-solid fa-sack-dollar w-4 text-center mr-1"></i>Precio Final Venta</span> <span class="font-black text-emerald-700 text-xl tracking-tight" id="det-venta">$0</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('view-productos').innerHTML = html;
        
        // Mantener cursor en buscador al tipificar
        const searchInput = document.getElementById('search-productos');
        if (searchInput && searchInput.value) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    },

    toggleModal(isEdit = false) {
        const modal = document.getElementById('modal-producto');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex'); // Se usa display flex para centrar
            document.getElementById('form-producto').reset();
            document.getElementById('prod-id').value = '';
            
            if (!isEdit) {
                document.getElementById('modal-producto-title').textContent = 'Crear Nuevo Producto';
                
                // Habilitar el código para nuevos ingresos
                const inputCodigo = document.getElementById('prod-codigo');
                inputCodigo.disabled = false;
                inputCodigo.classList.remove('bg-gray-200', 'cursor-not-allowed', 'opacity-70');
                document.getElementById('hint-codigo').innerText = "Importante: El código es auto-generado, pero puede modificarlo si lo desea.";
                
                // Generar código automático
                const count = (this.productos ? this.productos.length : 0) + 1;
                let num = count;
                let newCode = `PROD-${num.toString().padStart(4, '0')}`;
                while(this.productos && this.productos.some(p => p.codigo === newCode)) {
                    num++;
                    newCode = `PROD-${num.toString().padStart(4, '0')}`;
                }
                inputCodigo.value = newCode;
            }
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async save(event) {
        event.preventDefault();
        
        const id = document.getElementById('prod-id').value;
        const data = {
            codigo: document.getElementById('prod-codigo').value.trim().toUpperCase(),
            nombre: document.getElementById('prod-nombre').value.trim(),
            id_categoria: document.getElementById('prod-categoria').value || null,
            id_proveedor: document.getElementById('prod-proveedor').value || null,
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            precio_compra: parseFloat(document.getElementById('prod-precio-compra').value) || 0,
            precio_venta: parseFloat(document.getElementById('prod-precio-venta').value) || 0
        };

        if (id) {
            await Store.updateProducto(id, data);
            showToast('Ficha de producto actualizada correctamente');
        } else {
            // Regla de Negocio: Check if exact code already exists (pre-emptively)
            const productos = await Store.getProductos();
            const existing = productos.find(p => p.codigo === data.codigo);
            if (existing) {
                showToast('❌ CÓDIGO REPETIDO: Ya existe un registro grabado con ese código.', true);
                return;
            }
            await Store.addProducto(data);
            showToast('✅ Producto registrado en Base de Datos exitosamente');
        }

        this.toggleModal();
        this.render(); // Refrescar tabla
    },

    async edit(id) {
        // Precargar data SQL
        const productos = await Store.getProductos();
        const item = productos.find(c => c.id === id);
        if(!item) return;
        
        this.toggleModal(true); // Abre en modo edición sin generar código automático
        
        // Poblar datos
        document.getElementById('modal-producto-title').innerHTML = `Modificando <b>${item.codigo}</b>`;
        document.getElementById('prod-id').value = item.id;
        
        const inputCodigo = document.getElementById('prod-codigo');
        inputCodigo.value = item.codigo;
        // Bloqueo de seguridad: SQL impide modificar llaves únicas fácilmente si hay cascadas, por UX/UI bloqueamos el ID
        inputCodigo.disabled = true;
        inputCodigo.classList.add('bg-gray-200', 'cursor-not-allowed', 'opacity-70');
        document.getElementById('hint-codigo').innerText = "Bloqueado por seguridad. El código no puede ser alterado tras la creación.";

        document.getElementById('prod-nombre').value = item.nombre;
        document.getElementById('prod-categoria').value = item.id_categoria;
        document.getElementById('prod-proveedor').value = item.id_proveedor;
        document.getElementById('prod-stock').value = item.stock;
        document.getElementById('prod-precio-compra').value = item.precio_compra;
        document.getElementById('prod-precio-venta').value = item.precio_venta;
    },

    async viewDetails(id) {
        const productos = await Store.getProductos();
        const item = productos.find(c => c.id === id);
        if(!item) return;
        
        document.getElementById('det-nombre').textContent = item.nombre;
        document.getElementById('det-codigo').textContent = item.codigo;
        document.getElementById('det-cat').textContent = item.categoria_nombre || 'No asignada';
        document.getElementById('det-prov').textContent = item.proveedor_nombre || 'No registrado';
        
        const stockElem = document.getElementById('det-stock');
        const pillElem = document.getElementById('det-pill');
        stockElem.textContent = item.stock;
        
        if (item.stock < 10) {
            stockElem.className = "font-black text-rose-600 text-lg";
            pillElem.className = "absolute -bottom-2 -right-4 bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-sm animate-pulse";
            pillElem.textContent = "ALERTA STOCK";
        } else if (item.stock < 30) {
            stockElem.className = "font-black text-amber-600 text-lg";
            pillElem.className = "absolute -bottom-2 -right-4 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-sm";
            pillElem.textContent = "BAJO NÚMERO";
        } else {
            stockElem.className = "font-black text-emerald-600 text-lg";
            pillElem.className = "absolute -bottom-2 -right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-sm";
            pillElem.textContent = "STOCK OK";
        }

        document.getElementById('det-compra').textContent = formatMoney(item.precio_compra);
        document.getElementById('det-venta').textContent = formatMoney(item.precio_venta);

        const modal = document.getElementById('modal-detalles');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    async delete(id) {
        if (confirm('📛 ADVERTENCIA CRÍTICA: ¿Estás totalmente seguro de eliminar este producto del inventario? La acción purgará los registros conectados en ventas y no es reversible.')) {
            await Store.deleteProducto(id);
            showToast('🗑️ Ficha de producto depurada permanentemente', true); // Mensaje en toast rojo
            this.render();
        }
    }
};
