const ClientesView = {
    async render() {
        const query = document.getElementById('search-clientes')?.value.toLowerCase() || '';
        let clientes = await Store.getClientes();
        if (query) {
            clientes = clientes.filter(c => 
                c.nombre.toLowerCase().includes(query) ||
                (c.nit || '').toLowerCase().includes(query)
            );
        }
        
        const tableBody = clientes.length === 0 
            ? `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay clientes registrados</td></tr>`
            : clientes.map(c => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${c.nombre || ''}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${c.tipo_doc || 'NIT'} ${c.nit || ''}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${c.telefono || ''}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${c.correo || ''}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${c.estado === 'Inactivo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${c.estado || 'Activo'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-center">
                    <button onclick="ClientesView.edit('${c.id}')" class="text-blue-500 hover:text-blue-700 transition mr-3" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="ClientesView.delete('${c.id}')" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Directorio de Clientes</h2>
                    <p class="text-gray-500 mt-1">Gestión de propietarios, inquilinos y terceros</p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                        <input type="text" id="search-clientes" value="${query}" onkeyup="ClientesView.render()" placeholder="Buscar cliente..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    </div>
                    <button onclick="ClientesView.toggleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition whitespace-nowrap">
                        <i class="fa-solid fa-plus"></i> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-gray-200 text-slate-700">
                                <th class="px-6 py-3 font-semibold text-sm">NOMBRE COMPLETO</th>
                                <th class="px-6 py-3 font-semibold text-sm">DOCUMENTO</th>
                                <th class="px-6 py-3 font-semibold text-sm">TELÉFONO</th>
                                <th class="px-6 py-3 font-semibold text-sm">CORREO</th>
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

            <!-- Modal Nuevo/Editar Cliente -->
            <div id="modal-cliente" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all">
                    <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50 sticky top-0 z-10">
                        <h3 class="text-lg font-bold text-gray-800" id="modal-cliente-title">Registrar Cliente</h3>
                        <button onclick="ClientesView.toggleModal()" class="text-gray-400 hover:text-gray-600 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="form-cliente" onsubmit="ClientesView.save(event)" class="p-5">
                        <input type="hidden" id="cliente-id">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <!-- Tipo de Persona y Estado -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona *</label>
                                <select id="cli-tipo-persona" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="Natural">Natural</option>
                                    <option value="Empresa">Empresa</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Estado del Cliente *</label>
                                <select id="cli-estado" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>

                            <!-- Nombre o Razón Social -->
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo o Razón Social *</label>
                                <input type="text" id="cli-nombre" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <!-- Documento -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                                <select id="cli-tipo-doc" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="NIT">NIT</option>
                                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                                    <option value="CE">Cédula de Extranjería (CE)</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
                                <input type="text" id="cli-nit" required pattern="[0-9]+" oninput="this.value = this.value.replace(/[^0-9]/g, '')" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                <p class="text-xs text-orange-600 mt-1"><i class="fa-solid fa-circle-exclamation mr-1"></i>Solo se permiten números (sin puntos ni guiones)</p>
                            </div>

                            <!-- Fecha y Teléfono -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro *</label>
                                <input type="date" id="cli-fecha-registro" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="tel" id="cli-telefono" pattern="[0-9]+" oninput="this.value = this.value.replace(/[^0-9]/g, '')" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                <p class="text-xs text-orange-600 mt-1"><i class="fa-solid fa-circle-exclamation mr-1"></i>Solo números</p>
                            </div>

                            <!-- Correo y Dirección -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" id="cli-correo" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" id="cli-direccion" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <!-- Localidad -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                <input type="text" id="cli-ciudad" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                <input type="text" id="cli-departamento" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <!-- Código Postal -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                                <input type="text" id="cli-codigo-postal" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>
                        </div>

                        <div class="mt-8 pt-5 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
                            <button type="button" onclick="ClientesView.toggleModal()" class="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                            <button type="submit" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar Cliente
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('view-clientes').innerHTML = html;
        
        const searchInput = document.getElementById('search-clientes');
        if (searchInput && searchInput.value) searchInput.focus();
    },

    toggleModal(isEdit = false) {
        const modal = document.getElementById('modal-cliente');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('form-cliente').reset();
            document.getElementById('cliente-id').value = '';
            
            // Set default date to today for new clients
            const todayDate = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            document.getElementById('cli-fecha-registro').value = todayDate;
            
            if (isEdit !== true) {
                document.getElementById('modal-cliente-title').innerHTML = '<i class="fa-solid fa-user-plus text-brand-600 mr-2"></i>Registrar Cliente';
            }
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async save(event) {
        event.preventDefault();
        
        const id = document.getElementById('cliente-id').value;
        const data = {
            tipo_persona: document.getElementById('cli-tipo-persona').value,
            estado: document.getElementById('cli-estado').value,
            nombre: document.getElementById('cli-nombre').value.trim().toUpperCase(),
            tipo_doc: document.getElementById('cli-tipo-doc').value,
            nit: document.getElementById('cli-nit').value.trim(),
            fecha_registro: document.getElementById('cli-fecha-registro').value,
            telefono: document.getElementById('cli-telefono').value.trim(),
            correo: document.getElementById('cli-correo').value.trim(),
            direccion: document.getElementById('cli-direccion').value.trim(),
            ciudad: document.getElementById('cli-ciudad').value.trim(),
            departamento: document.getElementById('cli-departamento').value.trim(),
            codigo_postal: document.getElementById('cli-codigo-postal').value.trim()
        };

        if (id) {
            await Store.updateCliente(id, data);
            showToast('Cliente actualizado');
        } else {
            await Store.addCliente(data);
            showToast('Cliente registrado exitosamente');
        }

        this.toggleModal();
        this.render();
    },

    async edit(id) {
        const clientes = await Store.getClientes();
        const item = clientes.find(c => c.id === id);
        if(!item) return;
        
        this.toggleModal(true);
        document.getElementById('modal-cliente-title').innerHTML = '<i class="fa-solid fa-user-pen text-brand-600 mr-2"></i>Editar Cliente';
        
        document.getElementById('cliente-id').value = item.id;
        document.getElementById('cli-tipo-persona').value = item.tipo_persona || 'Empresa';
        document.getElementById('cli-estado').value = item.estado || 'Activo';
        document.getElementById('cli-nombre').value = item.nombre || '';
        document.getElementById('cli-tipo-doc').value = item.tipo_doc || 'NIT';
        document.getElementById('cli-nit').value = item.nit || '';
        
        const todayDate = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        document.getElementById('cli-fecha-registro').value = item.fecha_registro || todayDate;
        
        document.getElementById('cli-telefono').value = item.telefono || '';
        document.getElementById('cli-correo').value = item.correo || '';
        document.getElementById('cli-direccion').value = item.direccion || '';
        document.getElementById('cli-ciudad').value = item.ciudad || '';
        document.getElementById('cli-departamento').value = item.departamento || '';
        document.getElementById('cli-codigo-postal').value = item.codigo_postal || '';
    },

    async delete(id) {
        if (confirm('¿Está seguro de eliminar este cliente de forma permanente?')) {
            await Store.deleteCliente(id);
            showToast('Cliente eliminado correctamente');
            this.render();
        }
    }
};
