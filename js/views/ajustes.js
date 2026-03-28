const AjustesView = {
    render() {
        document.getElementById('header-title').textContent = 'Ajustes del Sistema';
        const html = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Configuración</h1>
                <p class="text-sm text-gray-500 mt-1">Administra las preferencias y ajustes del sistema EPRESEDI.</p>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                <div class="pb-6 border-b border-gray-100">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Perfil de la Empresa</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nombre</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm" value="EPRESEDI S.A.S" disabled>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">NIT</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm" value="900.123.456-7" disabled>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Preferencias</h2>
                    <div class="space-y-4">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked class="form-checkbox h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500">
                            <span class="text-sm text-gray-700">Recibir notificaciones por correo electrónico</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked class="form-checkbox h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500">
                            <span class="text-sm text-gray-700">Activar modo oscuro automático</span>
                        </label>
                    </div>
                </div>
                
                <div class="pt-4 flex justify-end gap-3">
                    <button onclick="window.location.hash='#dashboard'" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm font-medium">Cancelar</button>
                    <button onclick="showToast('Ajustes guardados correctamente')" class="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition text-sm font-medium shadow-sm">Guardar Cambios</button>
                </div>
            </div>
        `;
        document.getElementById('view-ajustes').innerHTML = html;
    }
};
