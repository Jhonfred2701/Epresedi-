const DashboardView = {
    async render() {
        const stats = await Store.getStats();
        const html = `
            <div class="mb-2">
                <h2 class="text-2xl font-bold text-gray-800">Inicio</h2>
            </div>
            
            <div class="bg-[#f4f6f9] rounded-xl p-8 shadow-inner border border-gray-100 mb-8 w-full max-w-5xl mx-auto">
                <h3 class="text-[17px] font-medium text-gray-700 mb-10">Te damos la bienvenida, ¿Qué deseas hacer?</h3>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6 text-center">
                    
                    <a href="#facturar" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center text-[#558fee] text-2xl mb-4 group-hover:scale-110 group-hover:shadow-md transition-all border border-gray-200">
                            <i class="fa-solid fa-file-invoice"></i>
                        </div>
                        <span class="text-[13px] font-medium text-gray-600 group-hover:text-blue-600">Crea una Factura<br>de Venta</span>
                    </a>

                    <a href="#clientes" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center shadow-sm text-[#558fee] text-2xl mb-4 group-hover:scale-110 group-hover:shadow-md transition-all border border-gray-200">
                            <i class="fa-solid fa-user-plus"></i>
                        </div>
                        <span class="text-[13px] font-medium text-gray-600 group-hover:text-blue-600">Crea un<br>Tercero / Cliente</span>
                    </a>

                    <a href="#inmuebles" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center shadow-sm text-[#558fee] text-2xl mb-4 group-hover:scale-110 group-hover:shadow-md transition-all border border-gray-200">
                            <i class="fa-solid fa-house-chimney"></i>
                        </div>
                        <span class="text-[13px] font-medium text-gray-600 group-hover:text-blue-600">Crea un<br>Inmueble / Propiedad</span>
                    </a>
                    
                    <a href="#historial" class="group flex flex-col items-center cursor-pointer transition">
                        <div class="w-[70px] h-[70px] bg-white rounded-full flex items-center justify-center shadow-sm text-[#558fee] text-2xl mb-4 group-hover:scale-110 group-hover:shadow-md transition-all border border-gray-200">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <span class="text-[13px] font-medium text-gray-600 group-hover:text-blue-600">Ver Reportes /<br>Documento soporte</span>
                    </a>
                </div>
            </div>
        `;
        document.getElementById('view-dashboard').innerHTML = html;
    }
};
