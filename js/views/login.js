const LoginView = {
    render() {
        const html = `
            <div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 absolute inset-0 z-50">
                <div class="sm:mx-auto sm:w-full sm:max-w-md">
                    <div class="flex justify-center mb-6">
                        <img src="img/logo.png" alt="EPRESEDI S.A.S" onerror="this.src=''; this.alt='EPRESEDI S.A.S'; this.className='hidden'; document.getElementById('logo-fallback').classList.remove('hidden');" class="h-24 w-auto object-contain mix-blend-multiply">
                        <div id="logo-fallback" class="hidden w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-brand-600">
                           <i class="fa-solid fa-building text-3xl"></i>
                        </div>
                    </div>
                    <h2 class="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Sistema Inmobiliario y Facturación
                    </p>
                </div>

                <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                        <form class="space-y-6" onsubmit="LoginView.handleLogin(event)">
                            <div>
                                <label for="username" class="block text-sm font-medium text-gray-700">Usuario</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fa-solid fa-user text-gray-400"></i>
                                    </div>
                                    <input id="username" type="text" required class="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 border" placeholder="admin">
                                </div>
                            </div>

                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
                                <div class="mt-1 relative rounded-md shadow-sm">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i class="fa-solid fa-lock text-gray-400"></i>
                                    </div>
                                    <input id="password" type="password" required class="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 border" placeholder="admin123">
                                </div>
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="text-sm">
                                    <a href="#" class="font-medium text-brand-600 hover:text-brand-500">¿Olvidaste tu contraseña?</a>
                                </div>
                            </div>

                            <div>
                                <button type="submit" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition">
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </div>
                    <p class="text-center text-xs text-gray-500 mt-6">
                        Credenciales de prueba: admin / admin123
                    </p>
                </div>
            </div>
        `;
        document.getElementById('view-login').innerHTML = html;
        document.getElementById('view-login').classList.add('active');
        
        // Hide sidebar and header
        document.getElementById('main-sidebar').style.display = 'none';
        document.getElementById('main-header').style.display = 'none';
        document.getElementById('main-content').classList.remove('p-6');
    },

    async handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        
        const success = await Store.login(user, pass);
        if (success) {
            showToast('Sesión iniciada correctamente');
            
            // Restore UI
            document.getElementById('main-sidebar').style.display = 'flex';
            document.getElementById('main-header').style.display = 'flex';
            document.getElementById('main-content').classList.add('p-6');
            
            window.location.hash = '#dashboard';
            window.location.reload();
        } else {
            showToast('Usuario o contraseña incorrectos', true);
        }
    },

    logout() {
        Store.logout();
        window.location.hash = '#login';
        window.location.reload();
    }
};
