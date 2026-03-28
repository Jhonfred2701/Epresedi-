const InmueblesView = {
    async render() {
        const query = document.getElementById('search-inmuebles')?.value.toLowerCase() || '';
        let inmuebles = await Store.getInmuebles();
        const clientes = await Store.getClientes();
        
        if (query) {
            inmuebles = inmuebles.filter(i => 
                i.direccion.toLowerCase().includes(query) ||
                i.tipo.toLowerCase().includes(query)
            );
        }
        
        const getClienteName = (id) => {
            if(!id) return '<span class="text-gray-400 italic">Ninguno</span>';
            const c = clientes.find(c => c.id === id);
            return c ? c.nombre : 'Desconocido';
        };

        const tableBody = inmuebles.length === 0 
            ? `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay inmuebles registrados</td></tr>`
            : inmuebles.map(i => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${i.direccion}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${i.tipo}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${getClienteName(i.clienteId)}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${formatMoney(i.precio)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${i.estado === 'Disponible' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                        ${i.estado}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-center">
                    <button onclick="InmueblesView.edit('${i.id}')" class="text-blue-500 hover:text-blue-700 transition mr-3" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="InmueblesView.delete('${i.id}')" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const dropdownClientes = clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.nit})</option>`).join('');

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Módulo de Inmuebles</h2>
                    <p class="text-gray-500 mt-1">Gestión de propiedades y disponibilidad</p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                        <input type="text" id="search-inmuebles" value="${query}" onkeyup="InmueblesView.render()" placeholder="Buscar por dirección..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    </div>
                    <button onclick="InmueblesView.toggleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition whitespace-nowrap">
                        <i class="fa-solid fa-plus"></i> Nuevo Inmueble
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-gray-200 text-slate-700">
                                <th class="px-6 py-3 font-semibold text-sm">DIRECCIÓN</th>
                                <th class="px-6 py-3 font-semibold text-sm">TIPO</th>
                                <th class="px-6 py-3 font-semibold text-sm">CLIENTE ASOCIADO</th>
                                <th class="px-6 py-3 font-semibold text-sm">PRECIO / CANON</th>
                                <th class="px-6 py-3 font-semibold text-sm">ESTADO</th>
                                <th class="px-6 py-3 font-semibold text-sm text-center">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableBody}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Nuevo/Editar Inmueble -->
            <div id="modal-inmueble" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                    <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
                        <h3 class="text-lg font-bold text-gray-800" id="modal-inmueble-title">Registrar Inmueble</h3>
                        <button onclick="InmueblesView.toggleModal()" class="text-gray-400 hover:text-gray-600 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="form-inmueble" onsubmit="InmueblesView.save(event)" class="p-5">
                        <input type="hidden" id="inmueble-id">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección del Inmueble *</label>
                                <input type="text" id="inm-direccion" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Inmueble *</label>
                                    <select id="inm-tipo" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
                                        <option value="Casa">Casa</option>
                                        <option value="Apartamento">Apartamento</option>
                                        <option value="Local">Local</option>
                                        <option value="Lote">Lote</option>
                                        <option value="Terreno">Terreno</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Precio / Canon *</label>
                                    <input type="number" id="inm-precio" required min="0" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select id="inm-estado" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
                                        <option value="Disponible">Disponible</option>
                                        <option value="Arrendado">Arrendado</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Cliente Asociado (Propietario / Arrendatario)</label>
                                    <select id="inm-cliente" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white">
                                        <option value="">Ninguno</option>
                                        ${dropdownClientes}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end gap-3 pt-5 border-t border-gray-100">
                            <button type="button" onclick="InmueblesView.toggleModal()" class="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                            <button type="submit" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('view-inmuebles').innerHTML = html;
        
        const searchInput = document.getElementById('search-inmuebles');
        if (searchInput && searchInput.value) searchInput.focus();
    },

    toggleModal(isEdit = false) {
        const modal = document.getElementById('modal-inmueble');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('form-inmueble').reset();
            document.getElementById('inmueble-id').value = '';
            if (isEdit !== true) {
                document.getElementById('modal-inmueble-title').textContent = 'Registrar Inmueble';
            }
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async save(event) {
        event.preventDefault();
        
        const id = document.getElementById('inmueble-id').value;
        const data = {
            direccion: document.getElementById('inm-direccion').value.trim(),
            tipo: document.getElementById('inm-tipo').value,
            precio: parseFloat(document.getElementById('inm-precio').value),
            estado: document.getElementById('inm-estado').value,
            clienteId: document.getElementById('inm-cliente').value
        };

        if (id) {
            await Store.updateInmueble(id, data);
            showToast('Inmueble actualizado');
        } else {
            await Store.addInmueble(data);
            showToast('Inmueble registrado');
        }

        this.toggleModal();
        this.render();
    },

    async edit(id) {
        const inmuebles = await Store.getInmuebles();
        const item = inmuebles.find(i => i.id === id);
        if(!item) return;
        
        this.toggleModal(true);
        document.getElementById('modal-inmueble-title').textContent = 'Editar Inmueble';
        document.getElementById('inmueble-id').value = item.id;
        document.getElementById('inm-direccion').value = item.direccion;
        document.getElementById('inm-tipo').value = item.tipo;
        document.getElementById('inm-precio').value = item.precio;
        document.getElementById('inm-estado').value = item.estado;
        document.getElementById('inm-cliente').value = item.clienteId;
    },

    async delete(id) {
        if (confirm('¿Eliminar este inmueble?')) {
            await Store.deleteInmueble(id);
            showToast('Inmueble eliminado');
            this.render();
        }
    }
};
