/**
 * proveedores.js
 * Módulo de la vista de Proveedores.
 */

const ProveedoresView = {
    proveedores: [],
    
    async render() {
        const container = document.getElementById('view-proveedores');
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-truck-fast text-brand-500"></i> Proveedores
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">Directorio y gestión de proveedores de inventario</p>
                </div>
                <button onclick="ProveedoresView.showModal()" class="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> Nuevo Proveedor
                </button>
            </div>

            <!-- Buscador -->
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-center">
                <div class="relative flex-1 max-w-md">
                    <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                    <input type="text" id="prov-search" onkeyup="ProveedoresView.filter()" placeholder="Buscar por nombre, correo o teléfono..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                </div>
                <div class="text-sm text-gray-500 font-medium">
                    <span id="prov-count">0</span> proveedores encontrados
                </div>
            </div>

            <!-- Tabla -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                                <th class="px-6 py-4 font-semibold">Proveedor</th>
                                <th class="px-6 py-4 font-semibold">Contacto & Teléfono</th>
                                <th class="px-6 py-4 font-semibold text-center">Correo</th>
                                <th class="px-6 py-4 font-semibold">Dirección</th>
                                <th class="px-6 py-4 font-semibold text-center w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="prov-table-body" class="divide-y divide-gray-100">
                            <!-- Filas dinámicas -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Formulario -->
            <div id="prov-modal" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm hidden z-[100] flex items-center justify-center p-4">
                <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl transform transition-all">
                    <!-- Modal Header -->
                    <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                        <h3 class="text-lg font-bold text-gray-800" id="prov-modal-title">Nuevo Proveedor</h3>
                        <button onclick="ProveedoresView.hideModal()" class="text-gray-400 hover:text-red-500 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <form id="prov-form" onsubmit="ProveedoresView.save(event)" class="p-6">
                        <input type="hidden" id="prov-id">
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor *</label>
                                <input type="text" id="prov-nombre" required 
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Nombre completo o razón social">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Contacto Principal</label>
                                    <input type="text" id="prov-contacto" 
                                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        placeholder="Nombre del asesor">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="tel" id="prov-telefono" 
                                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                        placeholder="+57 300 0000 000">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" id="prov-correo" 
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="contacto@proveedor.com">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" id="prov-direccion" 
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                    placeholder="Dirección física del proveedor">
                            </div>
                        </div>

                        <!-- Error Banner en Modal -->
                        <div id="prov-modal-error" class="hidden mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex gap-2 items-start">
                            <i class="fa-solid fa-circle-exclamation mt-0.5"></i>
                            <span id="prov-error-text">Mensaje de error</span>
                        </div>

                        <!-- Modal Footer -->
                        <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onclick="ProveedoresView.hideModal()" class="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">
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
            this.proveedores = await Store.getProveedores();
            this.renderTable(this.proveedores);
        } catch(e) {
            console.error("Error loading proveedores", e);
            showToast("Error al cargar proveedores", true);
        }
    },

    renderTable(data) {
        const tbody = document.getElementById('prov-table-body');
        if (!tbody) return;
        
        document.getElementById('prov-count').textContent = data.length;
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i class="fa-solid fa-truck-fast text-4xl text-gray-300 mb-3"></i>
                            <p class="text-base font-medium">No se encontraron proveedores</p>
                            <p class="text-sm mt-1">Crea un nuevo proveedor para comenzar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(p => {
            return `
                <tr class="hover:bg-brand-50/30 transition group">
                    <td class="px-6 py-4">
                        <div class="font-semibold text-gray-800">${p.nombre}</div>
                        ${p.id === 'PROV-GEN' ? '<span class="text-xs text-brand-600 font-medium">Por defecto</span>' : ''}
                    </td>
                    <td class="px-6 py-4 text-sm">
                        <div class="text-gray-800">${p.contacto || '<span class="italic text-gray-400">Sin contacto</span>'}</div>
                        <div class="text-gray-500">${p.telefono || '<span class="italic text-gray-400">Sin teléfono</span>'}</div>
                    </td>
                    <td class="px-6 py-4 text-center text-sm">
                        ${p.correo ? `<a href="mailto:${p.correo}" class="text-brand-600 hover:text-brand-800 hover:underline">${p.correo}</a>` : '<span class="italic text-gray-400">N/A</span>'}
                    </td>
                    <td class="px-6 py-4 text-gray-600 text-sm">
                        ${p.direccion || '<span class="italic text-gray-400">-</span>'}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="ProveedoresView.edit('${p.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center" title="Editar">
                                <i class="fa-solid fa-pen text-sm"></i>
                            </button>
                            ${p.id !== 'PROV-GEN' ? `
                            <button onclick="ProveedoresView.delete('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition flex items-center justify-center" title="Eliminar">
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
        const query = document.getElementById('prov-search').value.toLowerCase();
        const filt = this.proveedores.filter(p => 
            (p.nombre && p.nombre.toLowerCase().includes(query)) ||
            (p.correo && p.correo.toLowerCase().includes(query)) ||
            (p.telefono && p.telefono.toLowerCase().includes(query)) ||
            (p.contacto && p.contacto.toLowerCase().includes(query))
        );
        this.renderTable(filt);
    },

    showModal() {
        document.getElementById('prov-form').reset();
        document.getElementById('prov-id').value = '';
        document.getElementById('prov-modal-title').textContent = 'Nuevo Proveedor';
        document.getElementById('prov-modal-error').classList.add('hidden');
        
        const modal = document.getElementById('prov-modal');
        modal.classList.remove('hidden');
    },

    hideModal() {
        document.getElementById('prov-modal').classList.add('hidden');
    },

    edit(id) {
        const prov = this.proveedores.find(p => p.id === id);
        if(!prov) return;

        document.getElementById('prov-id').value = prov.id;
        document.getElementById('prov-nombre').value = prov.nombre;
        document.getElementById('prov-contacto').value = prov.contacto || '';
        document.getElementById('prov-telefono').value = prov.telefono || '';
        document.getElementById('prov-correo').value = prov.correo || '';
        document.getElementById('prov-direccion').value = prov.direccion || '';
        
        document.getElementById('prov-modal-title').textContent = 'Editar Proveedor';
        document.getElementById('prov-modal-error').classList.add('hidden');

        document.getElementById('prov-modal').classList.remove('hidden');
    },

    async save(e) {
        e.preventDefault();
        
        const id = document.getElementById('prov-id').value;
        const data = {
            nombre: document.getElementById('prov-nombre').value.trim(),
            contacto: document.getElementById('prov-contacto').value.trim(),
            telefono: document.getElementById('prov-telefono').value.trim(),
            correo: document.getElementById('prov-correo').value.trim(),
            direccion: document.getElementById('prov-direccion').value.trim()
        };

        const errorDiv = document.getElementById('prov-modal-error');
        const errorText = document.getElementById('prov-error-text');

        try {
            if (id) {
                await Store.updateProveedor(id, data);
                showToast("Proveedor actualizado correctamente");
            } else {
                await Store.addProveedor(data);
                showToast("Proveedor registrado satisfactoriamente");
            }
            this.hideModal();
            await this.loadData();
        } catch(err) {
            errorText.textContent = err.message || "Error al guardar proveedor";
            errorDiv.classList.remove('hidden');
        }
    },

    async delete(id) {
        if(!confirm("¿Estás seguro de eliminar este proveedor?")) return;
        try {
            await Store.deleteProveedor(id);
            showToast("Proveedor eliminado");
            await this.loadData();
        } catch(err) {
            showToast(err.message || "Error al eliminar proveedor", true);
        }
    }
};
