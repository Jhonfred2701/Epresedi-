const UsuariosView = {
    async render() {
        // Validación de Seguridad
        const session = JSON.parse(Store.getSession());
        if (!session || session.rol !== 'Administrador') {
            document.getElementById('view-usuarios').innerHTML = `
                <div class="p-8 text-center text-red-600 font-bold text-lg">
                    <i class="fa-solid fa-lock text-4xl mb-3"></i><br>
                    Acceso Denegado. Solo los administradores pueden ver este módulo.
                </div>
            `;
            return;
        }

        const query = document.getElementById('search-usuarios')?.value.toLowerCase() || '';
        let usuarios = await Store.getUsuarios();
        
        if (query) {
            usuarios = usuarios.filter(u => 
                u.nombre.toLowerCase().includes(query) ||
                u.username.toLowerCase().includes(query) ||
                (u.correo || '').toLowerCase().includes(query)
            );
        }
        
        const tableBody = usuarios.length === 0 
            ? `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay usuarios registrados</td></tr>`
            : usuarios.map(u => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${u.nombre}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${u.username}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${u.correo || 'N/A'}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${u.rol === 'Administrador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                        ${u.rol}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${u.estado === 'Inactivo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                        ${u.estado}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-center">
                    <button onclick="UsuariosView.edit('${u.id}')" class="text-blue-500 hover:text-blue-700 transition mr-3" title="Editar">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    ${u.username !== 'admin' ? `
                    <button onclick="UsuariosView.delete('${u.id}')" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

        const html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
                    <p class="text-gray-500 mt-1">Control de acceso y roles del sistema Epresedi</p>
                </div>
                <div class="flex gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-3 text-gray-400"></i>
                        <input type="text" id="search-usuarios" value="${query}" onkeyup="UsuariosView.render()" placeholder="Buscar usuario..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    </div>
                    <button onclick="UsuariosView.toggleModal()" class="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm flex items-center gap-2 transition whitespace-nowrap">
                        <i class="fa-solid fa-user-plus"></i> Nuevo Usuario
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-gray-200 text-slate-700">
                                <th class="px-6 py-3 font-semibold text-sm">NOMBRE COMPLETO</th>
                                <th class="px-6 py-3 font-semibold text-sm">USUARIO</th>
                                <th class="px-6 py-3 font-semibold text-sm">CORREO</th>
                                <th class="px-6 py-3 font-semibold text-sm">ROL</th>
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

            <!-- Modal Nuevo/Editar Usuario -->
            <div id="modal-usuario" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex-col items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
                    <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50 sticky top-0 z-10">
                        <h3 class="text-lg font-bold text-gray-800" id="modal-usuario-title">Registrar Usuario</h3>
                        <button onclick="UsuariosView.toggleModal()" class="text-gray-400 hover:text-gray-600 transition">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="form-usuario" onsubmit="UsuariosView.save(event)" class="p-5">
                        <input type="hidden" id="usr-id">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                <input type="text" id="usr-nombre" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" id="usr-correo" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario (Login) *</label>
                                <input type="text" id="usr-username" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña <span id="pwd-req">*</span></label>
                                <input type="password" id="usr-password" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="Mínimo 6 caracteres">
                                <p class="text-xs text-gray-500 mt-1" id="pwd-help">Si estás editando, déjala en blanco para no cambiarla.</p>
                            </div>

                            <div></div> <!-- Espacio en grid -->

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Rol en el Sistema *</label>
                                <select id="usr-rol" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="Empleado">Empleado (Acceso limitado)</option>
                                    <option value="Administrador">Administrador (Acceso total)</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                                <select id="usr-estado" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <div class="mt-8 pt-5 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
                            <button type="button" onclick="UsuariosView.toggleModal()" class="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                            <button type="submit" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('view-usuarios').innerHTML = html;
        
        const searchInput = document.getElementById('search-usuarios');
        if (searchInput && searchInput.value) searchInput.focus();
    },

    toggleModal(isEdit = false) {
        const modal = document.getElementById('modal-usuario');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.getElementById('form-usuario').reset();
            document.getElementById('usr-id').value = '';
            
            if (isEdit !== true) {
                document.getElementById('modal-usuario-title').innerHTML = '<i class="fa-solid fa-user-plus text-brand-600 mr-2"></i>Registrar Usuario';
                document.getElementById('usr-password').required = true;
                document.getElementById('pwd-req').textContent = '*';
                document.getElementById('pwd-help').textContent = 'Mínimo 6 caracteres.';
                document.getElementById('usr-username').readOnly = false;
            } else {
                document.getElementById('usr-password').required = false;
                document.getElementById('pwd-req').textContent = '';
                document.getElementById('pwd-help').textContent = 'Deja en blanco para conservar la actual.';
                document.getElementById('usr-username').readOnly = true; // el username idealmente no se cambia si ya existe
            }
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async save(event) {
        event.preventDefault();
        
        const id = document.getElementById('usr-id').value;
        const pwd = document.getElementById('usr-password').value;
        
        const data = {
            nombre: document.getElementById('usr-nombre').value.trim(),
            correo: document.getElementById('usr-correo').value.trim(),
            username: document.getElementById('usr-username').value.trim(),
            rol: document.getElementById('usr-rol').value,
            estado: document.getElementById('usr-estado').value,
            password: pwd,
            fecha_registro: new Date().toISOString().split('T')[0]
        };

        try {
            if (id) {
                await Store.updateUsuario(id, data);
                showToast('Usuario actualizado correctamente');
            } else {
                await Store.addUsuario(data);
                showToast('Usuario creado exitosamente');
            }
            this.toggleModal();
            this.render();
        } catch (error) {
            showToast(error.message, true);
        }
    },

    async edit(id) {
        const usuarios = await Store.getUsuarios();
        const item = usuarios.find(u => u.id === id);
        if(!item) return;
        
        this.toggleModal(true);
        document.getElementById('modal-usuario-title').innerHTML = '<i class="fa-solid fa-user-pen text-brand-600 mr-2"></i>Editar Usuario';
        
        document.getElementById('usr-id').value = item.id;
        document.getElementById('usr-nombre').value = item.nombre;
        document.getElementById('usr-correo').value = item.correo || '';
        document.getElementById('usr-username').value = item.username;
        document.getElementById('usr-rol').value = item.rol || 'Empleado';
        document.getElementById('usr-estado').value = item.estado || 'Activo';
        
        // Bloquear edición de rol/estado para el admin principal
        if(item.username === 'admin') {
            document.getElementById('usr-rol').disabled = true;
            document.getElementById('usr-estado').disabled = true;
            // Hack para que al guardar siga siendo admin
            document.getElementById('usr-rol').innerHTML += `<option value="Administrador" selected>Administrador (Fijo)</option>`;
        } else {
            document.getElementById('usr-rol').disabled = false;
            document.getElementById('usr-estado').disabled = false;
        }
    },

    async delete(id) {
        if (confirm('¿Está seguro de eliminar este usuario? No podrá recuperar esta cuenta.')) {
            await Store.deleteUsuario(id);
            showToast('Usuario eliminado correctamente');
            this.render();
        }
    }
};
