/**
 * categorias.js
 * Módulo de la vista de Categorías.
 */

const CategoriasView = {
    categorias: [],
    
    async render() {
        const container = document.getElementById('view-categorias');
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-list text-brand-500"></i> Categorías
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">Gestión de categorías para productos y servicios</p>
                </div>
                <button onclick="CategoriasView.showModal()" class="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> Nueva Categoría
                </button>
            </div>

            <!-- Buscador -->
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-center">
                <div class="relative flex-1 max-w-md">
                    <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                    <input type="text" id="cat-search" onkeyup="CategoriasView.filter()" placeholder="Buscar por nombre o descripción..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                </div>
                <div class="text-sm text-gray-500 font-medium">
                    <span id="cat-count">0</span> categorías encontradas
                </div>
            </div>

            <!-- Tabla -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                                <th class="px-6 py-4 font-semibold">Nombre</th>
                                <th class="px-6 py-4 font-semibold">Descripción</th>
                                <th class="px-6 py-4 font-semibold text-center">Estado</th>
                                <th class="px-6 py-4 font-semibold text-center w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="cat-table-body" class="divide-y divide-gray-100">
                            <!-- Filas dinámicas -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Formulario -->
            <div id="cat-modal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm hidden z-[100] flex items-center justify-center p-4">
                <div class="bg-white w-full max-w-md rounded-2xl shadow-xl transform transition-all">
                    <!-- Modal Header -->
                    <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                        <h3 class="text-lg font-bold text-gray-800" id="cat-modal-title">Nueva Categoría</h3>
                        <button onclick="CategoriasView.hideModal()" class="text-gray-400 hover:text-red-500 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <form id="cat-form" onsubmit="CategoriasView.save(event)" class="p-6">
                        <input type="hidden" id="cat-id">
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría *</label>
                                <input type="text" id="cat-nombre" required 
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Ej. Limpieza, Electrodomésticos...">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea id="cat-descripcion" rows="3"
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Detalles sobre la categoría..."></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select id="cat-estado" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <!-- Error Banner en Modal -->
                        <div id="cat-modal-error" class="hidden mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex gap-2 items-start">
                            <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
                            <span id="cat-error-text">Mensaje de error</span>
                        </div>

                        <!-- Modal Footer -->
                        <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onclick="CategoriasView.hideModal()" class="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">
                                Cancelar
                            </button>
                            <button type="submit" class="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-sm transition flex items-center gap-2">
                                <i class="fa-solid fa-save"></i> Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        await this.loadData();
    },

    async loadData() {
        try {
            this.categorias = await Store.getCategorias();
            this.renderTable(this.categorias);
        } catch(e) {
            console.error("Error loading categorias", e);
            showToast("Error al cargar categorías", true);
        }
    },

    renderTable(data) {
        const tbody = document.getElementById('cat-table-body');
        if (!tbody) return;
        
        document.getElementById('cat-count').textContent = data.length;
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i class="fa-solid fa-list text-4xl text-gray-300 mb-3"></i>
                            <p class="text-base font-medium">No se encontraron categorías</p>
                            <p class="text-sm mt-1">Crea una nueva categoría para comenzar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(c => {
            const estadoClass = c.estado === 'Activo' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-red-100 text-red-700 border-red-200';
            
            return `
                <tr class="hover:bg-brand-50/30 transition group">
                    <td class="px-6 py-4">
                        <div class="font-semibold text-gray-800">${c.nombre}</div>
                        ${c.id === 'CAT-GEN' ? '<span class="text-xs text-brand-600 font-medium">Por defecto</span>' : ''}
                    </td>
                    <td class="px-6 py-4 text-gray-600 text-sm">
                        ${c.descripcion || '<span class="italic text-gray-400">Sin descripción</span>'}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2.5 py-1 text-xs font-bold rounded-full border ${estadoClass}">
                            ${c.estado || 'Activo'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="CategoriasView.edit('${c.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="Editar">
                                <i class="fa-solid fa-pen text-sm"></i>
                            </button>
                            ${c.id !== 'CAT-GEN' ? `
                            <button onclick="CategoriasView.delete('${c.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center" title="Eliminar">
                                <i class="fa-solid fa-trash text-sm"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filter() {
        const query = document.getElementById('cat-search').value.toLowerCase();
        const filt = this.categorias.filter(c => 
            (c.nombre && c.nombre.toLowerCase().includes(query)) ||
            (c.descripcion && c.descripcion.toLowerCase().includes(query))
        );
        this.renderTable(filt);
    },

    showModal() {
        document.getElementById('cat-form').reset();
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-modal-title').textContent = 'Nueva Categoría';
        document.getElementById('cat-modal-error').classList.add('hidden');
        document.getElementById('cat-estado').value = 'Activo';
        
        const modal = document.getElementById('cat-modal');
        modal.classList.remove('hidden');
    },

    hideModal() {
        document.getElementById('cat-modal').classList.add('hidden');
    },

    edit(id) {
        const cat = this.categorias.find(c => c.id === id);
        if(!cat) return;

        document.getElementById('cat-id').value = cat.id;
        document.getElementById('cat-nombre').value = cat.nombre;
        document.getElementById('cat-descripcion').value = cat.descripcion || '';
        document.getElementById('cat-estado').value = cat.estado || 'Activo';
        
        document.getElementById('cat-modal-title').textContent = 'Editar Categoría';
        document.getElementById('cat-modal-error').classList.add('hidden');

        document.getElementById('cat-modal').classList.remove('hidden');
    },

    async save(e) {
        e.preventDefault();
        
        const id = document.getElementById('cat-id').value;
        const data = {
            nombre: document.getElementById('cat-nombre').value.trim(),
            descripcion: document.getElementById('cat-descripcion').value.trim(),
            estado: document.getElementById('cat-estado').value
        };

        const errorDiv = document.getElementById('cat-modal-error');
        const errorText = document.getElementById('cat-error-text');

        try {
            if (id) {
                await Store.updateCategoria(id, data);
                showToast("Categoría actualizada correctamente");
            } else {
                await Store.addCategoria(data);
                showToast("Categoría creada satisfactoriamente");
            }
            this.hideModal();
            await this.loadData();
        } catch(err) {
            errorText.textContent = err.message || "Error al guardar la categoría";
            errorDiv.classList.remove('hidden');
        }
    },

    async delete(id) {
        if(!confirm("¿Estás seguro de eliminar esta categoría?\nNota: Los productos vinculados podrían perder su referencia.")) return;
        try {
            await Store.deleteCategoria(id);
            showToast("Categoría eliminada");
            await this.loadData();
        } catch(err) {
            showToast(err.message || "Error al eliminar", true);
        }
    }
};
