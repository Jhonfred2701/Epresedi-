const App = {
    init() {
        Store.init();
        window.addEventListener('hashchange', this.router.bind(this));
        
        // Initial setup
        document.getElementById('main-sidebar').style.display = 'none';
        document.getElementById('main-header').style.display = 'none';
        
        this.setupNavigation();
        this.router();
    },
    
    setupNavigation() {
        const setNavActive = (hash) => {
            if(hash === '#login') return;
            const links = document.querySelectorAll('.nav-btn');
            links.forEach(link => {
                const linkHash = link.getAttribute('href');
                if (linkHash === hash || (hash === '' && linkHash === '#dashboard')) {
                    link.classList.remove('text-blue-100', 'hover:bg-white/10');
                    link.classList.add('bg-white/10', 'text-white', 'border-l-4', 'border-white', 'pl-2');
                    link.classList.remove('px-3');
                } else {
                    link.classList.remove('bg-white/10', 'text-white', 'border-l-4', 'border-white', 'pl-2');
                    link.classList.add('text-blue-100', 'hover:bg-white/10', 'px-3');
                }
            });
        };
        window.addEventListener('hashchange', () => setNavActive(window.location.hash));
        setNavActive(window.location.hash || '#dashboard');
    },

    router() {
        let hash = window.location.hash || '#dashboard';
        const views = document.querySelectorAll('.view-section');
        views.forEach(v => v.classList.remove('active'));
        
        const titleEl = document.getElementById('header-title');

        // Proteccion de rutas
        if (!Store.isLoggedIn() && hash !== '#login') {
            window.location.hash = '#login';
            return;
        }
        
        // Si está logueado y trata de ir al login, redirigir al dashboard
        if (Store.isLoggedIn() && hash === '#login') {
            window.location.hash = '#dashboard';
            return;
        }
        
        if (Store.isLoggedIn()) {
            document.getElementById('main-sidebar').style.display = 'flex';
            document.getElementById('main-header').style.display = 'flex';
            document.getElementById('main-content').classList.add('p-6');
            const user = JSON.parse(Store.getSession());
            if(user) {
                document.getElementById('active-username').textContent = user.username.toUpperCase();
                
                // Control de Roles
                const navUsuarios = document.getElementById('nav-usuarios');
                const btnAjustes = document.getElementById('btn-ajustes');
                
                if (user.rol === 'Administrador') {
                    if (navUsuarios) navUsuarios.style.display = 'flex';
                    if (btnAjustes) btnAjustes.classList.remove('hidden');
                } else {
                    if (navUsuarios) navUsuarios.style.display = 'none';
                    if (btnAjustes) btnAjustes.classList.add('hidden');
                }
            }
        }

        if(hash.startsWith('#factura/')) {
            document.getElementById('view-historial').classList.add('active');
            if (typeof HistorialView !== 'undefined') {
                HistorialView.renderFactura(hash.split('/')[1]);
            }
            return;
        }

        switch(hash) {
            case '#login':
                if(typeof LoginView !== 'undefined') LoginView.render();
                break;
            case '#dashboard':
                document.getElementById('view-dashboard').classList.add('active');
                if(typeof DashboardView !== 'undefined') DashboardView.render();
                break;
            case '#productos':
                document.getElementById('view-productos').classList.add('active');
                if(typeof ProductosView !== 'undefined') ProductosView.render();
                break;
            case '#categorias':
                document.getElementById('view-categorias').classList.add('active');
                if(typeof CategoriasView !== 'undefined') CategoriasView.render();
                break;
            case '#proveedores':
                document.getElementById('view-proveedores').classList.add('active');
                if(typeof ProveedoresView !== 'undefined') ProveedoresView.render();
                break;
            case '#compras':
                document.getElementById('view-compras').classList.add('active');
                if(typeof ComprasView !== 'undefined') ComprasView.render();
                break;
            case '#clientes':
                document.getElementById('view-clientes').classList.add('active');
                if(typeof ClientesView !== 'undefined') ClientesView.render();
                break;
            case '#inmuebles':
                document.getElementById('view-inmuebles').classList.add('active');
                if(typeof InmueblesView !== 'undefined') InmueblesView.render();
                break;
            case '#facturar':
                document.getElementById('view-facturar').classList.add('active');
                // Redirect to new unified Ventas module
                window.location.hash = '#ventas';
                break;
            case '#ventas':
                document.getElementById('view-ventas').classList.add('active');
                if(typeof VentasView !== 'undefined') VentasView.render();
                break;
            case '#historial':
                document.getElementById('view-historial').classList.add('active');
                if(typeof HistorialView !== 'undefined') HistorialView.renderList();
                break;
            case '#usuarios':
                document.getElementById('view-usuarios').classList.add('active');
                if(typeof UsuariosView !== 'undefined') UsuariosView.render();
                break;
            case '#ajustes':
                document.getElementById('view-ajustes').classList.add('active');
                if(typeof AjustesView !== 'undefined') AjustesView.render();
                break;
            default:
                document.getElementById('view-dashboard').classList.add('active');
                if(typeof DashboardView !== 'undefined') DashboardView.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
