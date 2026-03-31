const ProductosView = {
    productos: [],

    async render() {
        const query = document.getElementById('search-productos')?.value.toLowerCase() || '';
        let productos = await Store.getProductos();
        this.productos = productos;
        if (query) {
            productos = productos.filter(p => 
                p.nombre.toLowerCase().includes(query) ||
                p.codigo.toLowerCase().includes(query)
            );
        }
        
        const tableBody = productos.length === 0 
            ? `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No hay productos / servicios registrados</td></tr>`
            : productos.map(p => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium font-mono text-gray-700 w-32">${p.codigo}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${p.nombre}</td>
                <td class="px-6 py-4 text-sm text-right w-24">
                    <button onclick="ProductosView.edit('${p.id}')" class="text-blue-500 hover:text-blue-700 transition mr-3" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="ProductosView.delete('${p.id}')" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Catálogo de Productos y Servicios</h2>
                    <p class="text-gray-500 mt-1">Gestión de códigos y descripciones para la facturación</p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                        <input type="text" id="search-productos" value="${query}" onkeyup="ProductosView.render()" placeholder="Buscar por código o nombre..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    </div>
                    <button onclick="ProductosView.toggleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition whitespace-nowrap">
                        <i class="fa-solid fa-plus"></i> Nuevo
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-gray-200 text-slate-700">
                                <th class="px-6 py-3 font-semibold text-sm">CÓDIGO</th>
                                <th class="px-6 py-3 font-semibold text-sm">DESCRIPCIÓN / NOMBRE</th>
                                <th class="px-6 py-3 font-semibold text-sm text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableBody}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Nuevo/Editar Producto -->
            <div id="modal-producto" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                    <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
                        <h3 class="text-lg font-bold text-gray-800" id="modal-producto-title">Registrar Producto/Servicio</h3>
                        <button onclick="ProductosView.toggleModal()" class="text-gray-400 hover:text-gray-600 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="form-producto" onsubmit="ProductosView.save(event)" class="p-5">
                        <input type="hidden" id="prod-id">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Código Único *</label>
                                <input type="text" id="prod-codigo" required placeholder="Ej: ARR-01" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre / Descripción del Servicio *</label>
                                <input type="text" id="prod-nombre" required placeholder="Ej: Canon de Arrendamiento" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                            <div class="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mt-2 flex items-start gap-2">
                                <i class="fa-solid fa-circle-info mt-0.5"></i>
                                <p>El precio no se requiere aquí, se ingresa manualmente al momento de facturar.</p>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end gap-3 pt-5 border-t border-gray-100">
                            <button type="button" onclick="ProductosView.toggleModal()" class="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                            <button type="submit" class="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('view-productos').innerHTML = html;
        
        const searchInput = document.getElementById('search-productos');
        if (searchInput && searchInput.value) searchInput.focus();
    },

    toggleModal(isEdit = false) {
        const modal = document.getElementById('modal-producto');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('form-producto').reset();
            document.getElementById('prod-id').value = '';
            if (!isEdit) {
                document.getElementById('modal-producto-title').textContent = 'Registrar Producto/Servicio';
                
                // Generar código automático
                const count = (this.productos ? this.productos.length : 0) + 1;
                let num = count;
                let newCode = `PROD-${num.toString().padStart(4, '0')}`;
                while(this.productos && this.productos.some(p => p.codigo === newCode)) {
                    num++;
                    newCode = `PROD-${num.toString().padStart(4, '0')}`;
                }
                const inputCodigo = document.getElementById('prod-codigo');
                if (inputCodigo) inputCodigo.value = newCode;
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
            nombre: document.getElementById('prod-nombre').value.trim()
        };

        if (id) {
            await Store.updateProducto(id, data);
            showToast('Actualizado correctamente');
        } else {
            // Check if code already exists
            const productos = await Store.getProductos();
            const existing = productos.find(p => p.codigo === data.codigo);
            if (existing) {
                showToast('Ya existe un registro con este código', true);
                return;
            }
            await Store.addProducto(data);
            showToast('Registrado exitosamente');
        }

        this.toggleModal();
        this.render();
    },

    async edit(id) {
        const productos = await Store.getProductos();
        const item = productos.find(c => c.id === id);
        if(!item) return;
        
        this.toggleModal(true);
        document.getElementById('modal-producto-title').textContent = 'Editar Producto/Servicio';
        document.getElementById('prod-id').value = item.id;
        document.getElementById('prod-codigo').value = item.codigo;
        document.getElementById('prod-nombre').value = item.nombre;
    },

    async delete(id) {
        if (confirm('¿Eliminar este servicio del catálogo?')) {
            await Store.deleteProducto(id);
            showToast('Eliminado correctamente');
            this.render();
        }
    }
};
