// Gestión de Estado de Datos conectado al Backend Node.js+MySQL
const Store = {
    // URL relativa: funciona tanto en local como en Glitch automáticamente
    API_URL: '/api',

    init() {
        // La inicialización ya no necesita crear datos quemados en localStorage.
        // Asumimos que la base de datos ya contiene la info.
    },

    // AUTH
    async login(username, password) {
        try {
            const res = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                window.localStorage.setItem('epresedi_sesion', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error conectando al backend", e);
            return false;
        }
    },
    logout() {
        window.localStorage.removeItem('epresedi_sesion');
    },
    isLoggedIn() {
        return !!window.localStorage.getItem('epresedi_sesion');
    },
    getSession() {
        return window.localStorage.getItem('epresedi_sesion');
    },

    // USUARIOS
    async getUsuarios() { 
        try {
            const res = await fetch(`${this.API_URL}/usuarios`);
            return await res.json();
        } catch (e) { return []; }
    },
    async addUsuario(data) {
        const res = await fetch(`${this.API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        return json;
    },
    async updateUsuario(id, data) {
        const res = await fetch(`${this.API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
    },
    async deleteUsuario(id) {
        await fetch(`${this.API_URL}/usuarios/${id}`, { method: 'DELETE' });
    },

    // CLIENTES
    async getClientes() { 
        try {
            const res = await fetch(`${this.API_URL}/clientes`);
            return await res.json();
        } catch (e) { return []; }
    },
    async addCliente(data) {
        const res = await fetch(`${this.API_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async updateCliente(id, data) {
        await fetch(`${this.API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    async deleteCliente(id) {
        await fetch(`${this.API_URL}/clientes/${id}`, { method: 'DELETE' });
    },

    // INMUEBLES
    async getInmuebles() { 
        try {
            const res = await fetch(`${this.API_URL}/inmuebles`);
            return await res.json();
        } catch (e) { return []; }
    },
    async addInmueble(data) {
        const res = await fetch(`${this.API_URL}/inmuebles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async updateInmueble(id, data) {
        await fetch(`${this.API_URL}/inmuebles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    async deleteInmueble(id) {
        await fetch(`${this.API_URL}/inmuebles/${id}`, { method: 'DELETE' });
    },

    // PRODUCTOS
    async getProductos() { 
        try {
            const res = await fetch(`${this.API_URL}/productos`);
            return await res.json();
        } catch (e) { return []; }
    },
    async addProducto(data) {
        const res = await fetch(`${this.API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async updateProducto(id, data) {
        await fetch(`${this.API_URL}/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    async deleteProducto(id) {
        await fetch(`${this.API_URL}/productos/${id}`, { method: 'DELETE' });
    },

    // FACTURAS
    async getFacturas() { 
        try {
            const res = await fetch(`${this.API_URL}/facturas`);
            return await res.json();
        } catch (e) { return []; }
    },
    async addFactura(data) {
        const res = await fetch(`${this.API_URL}/facturas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async deleteFactura(id) {
        await fetch(`${this.API_URL}/facturas/${id}`, { method: 'DELETE' });
    },

    // ESTADISTICAS
    async getStats() {
        const facturas = await this.getFacturas();
        const clientes = await this.getClientes();
        const inmuebles = await this.getInmuebles();
        
        const totalIngresos = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
        const disponibles = inmuebles.filter(i => i.estado === 'Disponible').length;
        
        return {
            totalClientes: clientes.length,
            facturasMes: facturas.length,
            ingresosTotales: totalIngresos,
            inmueblesDisponibles: disponibles
        };
    }
};

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if(!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-CO');
};

const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast');
    if(!toast) return;
    const msg = document.getElementById('toast-msg');
    
    msg.textContent = message;
    
    if (isError) {
        toast.classList.replace('bg-green-500', 'bg-red-500');
        toast.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span id="toast-msg">${message}</span>`;
    } else {
        toast.classList.replace('bg-red-500', 'bg-green-500');
        toast.innerHTML = `<i class="fa-solid fa-check-circle"></i><span id="toast-msg">${message}</span>`;
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
};
