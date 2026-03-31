const DashboardView = {
    async render() {
        // Obtenemos los stats en tiempo real directamente desde Postgres (optimizado)
        const stats = await Store.getStats();
        
        // Manejo de valores default en caso de fallo o primera carga
        const totalProductos = stats.totalProductos || 0;
        const totalVentas = stats.totalVentas || 0;
        const lowStock = stats.lowStock || 0;
        const totalClientes = stats.totalClientes || 0;
        const totalIngresos = formatMoney(stats.ingresosTotales || 0);

        const html = `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Panel de Control</h2>
                    <p class="text-gray-500 mt-1">Resumen general del sistema administrativo</p>
                </div>
            </div>

            <!-- TARJETAS DE MÉTRICAS (Bootstrap-like Cards con Tailwind) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <!-- Productos Totales (Azul - Primary) -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div class="absolute inset-y-0 left-0 w-1 bg-blue-500"></div>
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Productos</p>
                                <h3 class="text-3xl font-black text-gray-800">${totalProductos}</h3>
                            </div>
                            <div class="w-14 h-14 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                                <i class="fa-solid fa-box-open"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ventas Realizadas (Verde - Success) -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div class="absolute inset-y-0 left-0 w-1 bg-emerald-500"></div>
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas Realizadas</p>
                                <h3 class="text-3xl font-black text-gray-800">${totalVentas}</h3>
                            </div>
                            <div class="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-2xl group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                                <i class="fa-solid fa-shopping-cart"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stock Bajo (Rojo - Danger) -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div class="absolute inset-y-0 left-0 w-1 bg-rose-500"></div>
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alerta Stock < 10</p>
                                <h3 class="text-3xl font-black text-rose-600">${lowStock}</h3>
                            </div>
                            <div class="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-2xl group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                                <i class="fa-solid fa-boxes-packing"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Total Clientes (Naranja - Warning) -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
                    <div class="absolute inset-y-0 left-0 w-1 bg-amber-500"></div>
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Terceros Registrados</p>
                                <h3 class="text-3xl font-black text-gray-800">${totalClientes}</h3>
                            </div>
                            <div class="w-14 h-14 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-2xl group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                                <i class="fa-solid fa-users"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ACCESOS RÁPIDOS MÓDULOS -->
            <div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 max-w-full">
                <h3 class="text-lg font-bold text-gray-800 mb-8 border-b border-gray-100 pb-3 flex items-center">
                    <i class="fa-solid fa-grip mr-3 text-brand-600"></i> Accesos Directos
                </h3>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-10 gap-x-4 text-center">
                    
                    <a href="#productos" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-all duration-300 ease-out">
                            <i class="fa-solid fa-box-open"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700 group-hover:text-brand-700">Productos</span>
                    </a>

                    <!-- Enlaces Demo (Próximamente) -->
                    <a href="javascript:showToast('Módulo Categorías próximamente')" class="group flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-300">
                            <i class="fa-solid fa-tags"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700">Categorías</span>
                    </a>

                    <a href="javascript:showToast('Módulo Proveedores próximamente')" class="group flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-300">
                            <i class="fa-solid fa-truck-field"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700">Proveedores</span>
                    </a>

                    <a href="javascript:showToast('Módulo Compras próximamente')" class="group flex flex-col items-center cursor-pointer opacity-80 hover:opacity-100 transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-300">
                            <i class="fa-solid fa-cart-arrow-down"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700">Compras</span>
                    </a>

                    <!-- Módulos Activos Principales -->
                    <a href="#facturar" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-16 h-16 bg-brand-50 border border-brand-200 rounded-2xl flex items-center justify-center text-brand-600 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-all duration-300 ease-out">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                        <span class="text-sm font-bold text-brand-700">Facturación</span>
                    </a>

                    <a href="#clientes" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-all duration-300 ease-out">
                            <i class="fa-solid fa-users-viewfinder"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700 group-hover:text-brand-700">Clientes</span>
                    </a>

                    <a href="#historial" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 text-2xl mb-3 group-hover:-translate-y-2 group-hover:shadow-lg group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-all duration-300 ease-out">
                            <i class="fa-solid fa-chart-pie"></i>
                        </div>
                        <span class="text-sm font-semibold text-gray-700 group-hover:text-brand-700">Reportes</span>
                    </a>

                </div>
            </div>
            
            <!-- Resumen Financiero Extra Inferior -->
            <div class="bg-gradient-to-r from-[#212529] to-[#343a40] rounded-xl p-8 shadow-lg text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <i class="fa-solid fa-chart-line absolute -right-4 -bottom-4 text-8xl text-white opacity-5"></i>
                <div class="mb-4 md:mb-0 relative z-10 text-center md:text-left">
                    <h3 class="text-xl font-bold mb-1">Resumen General de Ingresos</h3>
                    <p class="text-gray-400 text-sm">Suma neta histórica de todas las facturas consolidadas</p>
                </div>
                <div class="text-4xl md:text-5xl font-black tracking-tight text-[#80c342] relative z-10">
                    ${totalIngresos}
                </div>
            </div>
        `;
        document.getElementById('view-dashboard').innerHTML = html;
    }
};
