/**
 * clientes.js
 * Módulo para la vista CRUD de Clientes.
 */

const ClientesView = {
    clientes: [],
    editingId: null,

    async render() {
        const container = document.getElementById('view-clientes');
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
                        <i class="fa-solid fa-users text-brand-600"></i> Gestión de Clientes
                    </h2>
                    <p class="text-sm text-gray-500 mt-1 font-medium">Administra tu cartera de clientes y su facturación (Fiscal y Básica)</p>
                </div>
                <button onclick="ClientesView.openModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-brand-500/30 flex items-center gap-2 transition hover:-translate-y-0.5">
                    <i class="fa-solid fa-plus"></i> Nuevo Cliente
                </button>
            </div>

            <!-- Búsqueda en tiempo real -->
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fa-solid fa-search text-gray-400"></i>
                    </div>
                    <input type="text" id="clientes-search" oninput="ClientesView.filter()" placeholder="Buscar cliente por nombre o correo..." class="pl-10 w-full border-2 border-slate-200 rounded-lg py-2 focus:border-brand-500 focus:outline-none transition">
                </div>
            </div>

            <!-- Tabla -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead class="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">Nombre Completo</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">Contacto</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">Ubicación</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest">Info Fiscal</th>
                                <th class="px-6 py-4 font-black text-xs text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="clientes-table-body" class="divide-y divide-gray-100">
                            <tr><td colspan="5" class="p-8 text-center text-gray-400 font-medium">Cargando portafolio de clientes...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Formularios -->
            <div id="modal-cliente" class="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 hidden items-center justify-center p-4 backdrop-blur-sm transition-all overflow-y-auto">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform relative my-8">
                    <!-- Configuración Header Modal -->
                    <div class="px-8 py-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                        <h3 class="text-xl font-black text-gray-800 flex items-center gap-2" id="modal-cliente-title">
                            <i class="fa-solid fa-user-plus text-brand-600"></i> Agregar Cliente
                        </h3>
                        <button type="button" onclick="ClientesView.closeModal()" class="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <form id="form-cliente" onsubmit="ClientesView.save(event)" class="px-8 py-6 max-h-[70vh] overflow-y-auto">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Sección BÁSICOS -->
                            <div class="space-y-4">
                                <h4 class="text-sm font-black text-brand-600 uppercase tracking-widest border-b pb-2 mb-4">Información Básica</h4>
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Nombre Comercial / Completo *</label>
                                    <input type="text" id="cli-nombre" required class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none transition" placeholder="Ej. Juan Pérez">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Teléfono</label>
                                        <div class="relative">
                                            <i class="fa-solid fa-phone absolute left-3 top-3 text-gray-400"></i>
                                            <input type="tel" id="cli-telefono" class="pl-10 w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none transition" placeholder="Opcional">
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Correo Electrónico *</label>
                                        <div class="relative">
                                            <i class="fa-solid fa-envelope absolute left-3 top-3 text-gray-400"></i>
                                            <input type="email" id="cli-correo" required class="pl-10 w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none transition" placeholder="correo@empresa.com">
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Dirección Principal</label>
                                    <input type="text" id="cli-direccion" class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none transition" placeholder="Av. Principal 123">
                                </div>
                            </div>

                            <!-- Sección FISCALES -->
                            <div class="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 class="text-sm font-black text-slate-700 uppercase tracking-widest border-b pb-2 mb-4">Datos Tributarios & Fiscales</h4>
                                
                                <div class="grid grid-cols-2 gap-4">
                                     <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Tipo de Cliente</label>
                                        <select id="cli-tipo_persona" class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none cursor-pointer">
                                            <option value="Empresa">Persona Jurídica (Empresa)</option>
                                            <option value="Natural">Persona Natural</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Documento Asociado</label>
                                        <select id="cli-tipo_doc" class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none cursor-pointer">
                                            <option value="NIT">NIT</option>
                                            <option value="CC">Cédula Ciudadanía</option>
                                            <option value="CE">Cédula Extranjería</option>
                                            <option value="RUT">RUT</option>
                                            <option value="PAS">Pasaporte</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Número Documento / NIT</label>
                                    <div class="relative">
                                        <i class="fa-solid fa-id-card absolute left-3 top-3 text-gray-400"></i>
                                        <input type="text" id="cli-nit" class="pl-10 w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none transition" placeholder="123456789-0">
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Ciudad</label>
                                        <input type="text" id="cli-ciudad" class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none" placeholder="Opcional">
                                    </div>
                                    <div>
                                        <label class="block text-xs uppercase font-bold text-gray-600 mb-1">Departamento</label>
                                        <input type="text" id="cli-departamento" class="w-full border-2 border-slate-200 rounded-lg px-4 py-2 focus:border-brand-500 outline-none" placeholder="Opcional">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button type="button" onclick="ClientesView.closeModal()" class="px-5 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 border border-transparent transition">Cancelar</button>
                            <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md shadow-brand-500/30 transition flex items-center gap-2">
                                <i class="fa-solid fa-save"></i> <span id="modal-cliente-btn">Guardar Cliente</span>
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
            this.clientes = await Store.getClientes();
            this.renderTable(this.clientes);
        } catch (error) {
            console.error(error);
            showToast("Hubo un error cargando los clientes", true);
        }
    },

    filter() {
        const query = document.getElementById('clientes-search').value.toLowerCase();
        const filtred = this.clientes.filter(c => 
            (c.nombre && c.nombre.toLowerCase().includes(query)) || 
            (c.correo && c.correo.toLowerCase().includes(query)) ||
            (c.nit && c.nit.toLowerCase().includes(query))
        );
        this.renderTable(filtred);
    },

    renderTable(data) {
        const tbody = document.getElementById('clientes-table-body');
        if(!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-400 font-medium">No se encontraron clientes</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(c => `
            <tr class="hover:bg-slate-50 transition border-b border-gray-50 group">
                <td class="px-6 py-5 cursor-pointer" onclick="ClientesView.edit('${c.id}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-lg">
                            ${c.nombre ? c.nombre.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm group-hover:text-brand-600 transition">${c.nombre}</div>
                            <div class="text-xs text-gray-400"><i class="fa-solid fa-clock mr-1"></i> Registrado: ${c.fecha_registro || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-600 truncate flex items-center gap-2">
                        <i class="fa-solid fa-envelope text-gray-400"></i> ${c.correo}
                    </div>
                    ${c.telefono ? `<div class="text-xs text-gray-500 mt-1 flex items-center gap-2"><i class="fa-solid fa-phone text-gray-400"></i> ${c.telefono}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 whitespace-normal">
                    ${c.direccion ? `📍 <span class="font-medium outline-1">${c.direccion}</span>` : 'Sin Dirección'}
                    ${c.ciudad ? `<span class="block text-xs mt-1 text-gray-400">${c.ciudad}${c.departamento ? ', ' + c.departamento : ''}</span>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-md text-xs border border-slate-200 mr-1">${c.tipo_doc}: ${c.nit || 'S/N'}</span>
                    <span class="text-xs tracking-wider inline-block font-black text-emerald-600 mt-1 uppercase">${c.tipo_persona}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="ClientesView.edit('${c.id}')" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="ClientesView.delete('${c.id}')" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    openModal() {
        this.editingId = null;
        document.getElementById('form-cliente').reset();
        document.getElementById('modal-cliente-title').innerHTML = '<i class="fa-solid fa-user-plus text-brand-600"></i> Agregar Cliente';
        document.getElementById('modal-cliente-btn').innerText = 'Guardar Nuevo Cliente';
        document.getElementById('modal-cliente').classList.remove('hidden');
        document.getElementById('modal-cliente').classList.add('flex');
    },

    closeModal() {
        document.getElementById('modal-cliente').classList.add('hidden');
        document.getElementById('modal-cliente').classList.remove('flex');
    },

    edit(id) {
        const c = this.clientes.find(x => x.id === id);
        if(!c) return;

        this.editingId = id;
        document.getElementById('cli-nombre').value = c.nombre || '';
        document.getElementById('cli-telefono').value = c.telefono || '';
        document.getElementById('cli-correo').value = c.correo || '';
        document.getElementById('cli-direccion').value = c.direccion || '';
        document.getElementById('cli-nit').value = c.nit || '';
        document.getElementById('cli-ciudad').value = c.ciudad || '';
        document.getElementById('cli-departamento').value = c.departamento || '';
        
        if (c.tipo_persona) document.getElementById('cli-tipo_persona').value = c.tipo_persona;
        if (c.tipo_doc) document.getElementById('cli-tipo_doc').value = c.tipo_doc;

        document.getElementById('modal-cliente-title').innerHTML = '<i class="fa-solid fa-user-pen text-brand-600"></i> Editar Cliente';
        document.getElementById('modal-cliente-btn').innerText = 'Guardar Cambios';
        document.getElementById('modal-cliente').classList.remove('hidden');
        document.getElementById('modal-cliente').classList.add('flex');
    },

    async save(e) {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('cli-nombre').value.trim(),
            telefono: document.getElementById('cli-telefono').value.trim(),
            correo: document.getElementById('cli-correo').value.trim(),
            direccion: document.getElementById('cli-direccion').value.trim(),
            tipo_persona: document.getElementById('cli-tipo_persona').value,
            tipo_doc: document.getElementById('cli-tipo_doc').value,
            nit: document.getElementById('cli-nit').value.trim(),
            ciudad: document.getElementById('cli-ciudad').value.trim(),
            departamento: document.getElementById('cli-departamento').value.trim()
        };

        const btn = document.getElementById('modal-cliente-btn');
        btn.innerText = 'Guardando...';

        try {
            if(this.editingId) {
                await Store.updateCliente(this.editingId, data);
                showToast("Cambios guardados correctamente");
            } else {
                await Store.addCliente(data);
                showToast("Cliente agregado exitosamente");
            }
            this.closeModal();
            await this.loadData();
        } catch(err) {
            console.error(err);
            showToast(err.message || "Error guardando información", true);
        } finally {
            btn.innerText = this.editingId ? 'Guardar Cambios' : 'Guardar Nuevo Cliente';
        }
    },

    async delete(id) {
        if(!confirm("¿Estás seguro de querer eliminar este cliente permanentemente?")) return;
        try {
            await Store.deleteCliente(id);
            showToast("Cliente eliminado del sistema");
            await this.loadData();
        } catch(error) {
            console.error(error);
            showToast(error.message || "Error al eliminar ficha del cliente", true);
        }
    }
};
