const VentasView = {

    _currentTipo: null,
    _productosCache: [],
    _rowCount: 1,

    async render(tipoInicial = 'canon') {
        const tipos = [
            { id: 'canon',       icon: 'fa-house',          label: 'Canon de Arrendamiento'   },
            { id: 'comision',    icon: 'fa-handshake',      label: 'Comisión Inmobiliaria'    },
            { id: 'comprobante', icon: 'fa-receipt',        label: 'Comprobante de Pago'      },
            { id: 'electronico', icon: 'fa-mobile-screen',  label: 'Pago Electrónico'         },
            { id: 'servicios',   icon: 'fa-file-invoice',   label: 'Servicios Adicionales'    },
        ];

        const html = `
            <div class="px-6 py-5">
                <!-- Encabezado del módulo -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Módulo de Ventas</h2>
                        <p class="text-gray-500 mt-1 text-sm">Gestión de documentos comerciales EPRESEDI S.A.S.</p>
                    </div>
                    <a href="#historial" class="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-2 transition">
                        <i class="fa-solid fa-clock-rotate-left"></i> Ver Historial
                    </a>
                </div>

                <!-- Selector de Tipo de Documento -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    ${tipos.map(t => `
                        <button
                            id="tipo-btn-${t.id}"
                            onclick="VentasView.selectTipo('${t.id}')"
                            class="tipo-doc-btn flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50 transition cursor-pointer text-center group"
                        >
                            <div class="w-11 h-11 rounded-full bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition">
                                <i class="fa-solid ${t.icon} text-lg text-gray-500 group-hover:text-brand-600 transition"></i>
                            </div>
                            <span class="text-xs font-semibold text-gray-600 group-hover:text-brand-700 leading-tight">${t.label}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Formulario dinámico (se llena inmediatamente) -->
                <div id="ventas-form-container"></div>
            </div>
        `;

        document.getElementById('view-ventas').innerHTML = html;

        // Auto-seleccionar el tipo inicial y mostrar el formulario de inmediato
        this._productosCache = []; // reset cache on fresh render
        this._rowCount = 1;
        this.selectTipo(tipoInicial);
    },

    selectTipo(tipo) {
        this._currentTipo = tipo;

        // Highlight active type button
        document.querySelectorAll('.tipo-doc-btn').forEach(b => {
            b.classList.remove('border-brand-600', 'bg-brand-50', 'shadow-md');
            b.classList.add('border-gray-200');
        });
        const activeBtn = document.getElementById(`tipo-btn-${tipo}`);
        if (activeBtn) {
            activeBtn.classList.add('border-brand-600', 'bg-brand-50', 'shadow-md');
            activeBtn.classList.remove('border-gray-200');
        }

        // Cargar formulario según tipo y luego previsualizar el número
        switch (tipo) {
            case 'canon':       this.renderFormCanon();       break;
            case 'comision':    this.renderFormComision();    break;
            case 'comprobante': this.renderFormComprobante(); break;
            case 'electronico': this.renderFormElectronico(); break;
            case 'servicios':   this.renderFormServicios();   break;
        }
        // Actualizar el campo de número de documento después de renderizar el form
        setTimeout(() => this._actualizarNumeroPreview(), 50);
    },

    // ─── Shared form wrapper ───────────────────────────────────────────────────
    _wrapForm(titulo, icon, descripcion, fieldsHtml, showPaymentFields = true) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="bg-gradient-to-r from-brand-700 to-brand-600 px-6 py-4 text-white flex items-center gap-3">
                    <i class="fa-solid ${icon} text-2xl"></i>
                    <div>
                        <h3 class="font-bold text-lg">${titulo}</h3>
                        <p class="text-blue-100 text-xs">${descripcion}</p>
                    </div>
                </div>
                <form id="ventas-form" onsubmit="VentasView.guardar(event)" class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <!-- DATOS DEL CLIENTE -->
                        <div class="md:col-span-2">
                            <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                                <i class="fa-solid fa-user text-brand-600"></i> Datos del Cliente
                            </h4>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                            <select id="v-cliente" required onchange="VentasView.onClienteChange()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                <option value="">-- Seleccionar Cliente --</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Identificación</label>
                            <input type="text" id="v-nit" readonly class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600" placeholder="Se llena automáticamente">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input type="text" id="v-telefono" readonly class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                            <input type="text" id="v-correo" readonly class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
                        </div>

                        <!-- INFORMACIÓN DE FACTURA -->
                        <div class="md:col-span-2 mt-2">
                            <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                                <i class="fa-solid fa-file-invoice text-brand-600"></i> Información del Documento
                            </h4>
                        </div>
                        <!-- Número de documento generado automáticamente -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fa-solid fa-hashtag text-brand-500 mr-1"></i>Número de Documento
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="text" id="v-numero-factura" readonly
                                    class="w-full border border-brand-300 bg-brand-50 rounded-lg px-3 py-2 text-sm font-bold text-brand-700 tracking-wider cursor-not-allowed"
                                    placeholder="Cargando..." title="Generado automáticamente al guardar">
                                <span class="text-xs text-gray-400 whitespace-nowrap">Auto</span>
                            </div>
                            <p class="text-xs text-gray-400 mt-0.5">Se genera automáticamente al guardar</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión *</label>
                            <input type="date" id="v-fecha" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                            <input type="date" id="v-fecha-vencimiento" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select id="v-estado" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                <option value="emitida">Emitida</option>
                                <option value="pagada">Pagada</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="anulada">Anulada</option>
                            </select>
                        </div>
                        ${showPaymentFields ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Medio de Pago</label>
                            <select id="v-metodo-pago-global" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                                <option value="">-- Sin especificar --</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia Bancaria</option>
                                <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                                <option value="Nequi">Nequi</option>
                                <option value="Daviplata">Daviplata</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
                            <input type="date" id="v-fecha-pago-global" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                        </div>` : ''}

                        ${fieldsHtml}

                        <!-- DETALLE DE SERVICIOS -->
                        <div class="md:col-span-2 mt-2">
                            <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                                <i class="fa-solid fa-list text-brand-600"></i> Detalle del Servicio
                            </h4>
                            <div class="overflow-x-auto rounded-lg border border-gray-200 mb-3">
                                <table class="w-full text-sm">
                                    <thead class="bg-[#dce6f2]">
                                        <tr>
                                            <th class="px-3 py-2 text-left font-semibold text-gray-700">Descripción</th>
                                            <th class="px-3 py-2 text-center font-semibold text-gray-700 w-20">Cantidad</th>
                                            <th class="px-3 py-2 text-right font-semibold text-gray-700 w-36">Valor Unitario</th>
                                            <th class="px-3 py-2 text-right font-semibold text-gray-700 w-36">Subtotal</th>
                                            <th class="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="v-items-body">
                                        <tr id="v-row-0">
                                            <td class="px-2 py-1">
                                                <select id="v-desc-0" onchange="VentasView.onProductoChange(0)" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-brand-400 focus:outline-none">
                                                    <option value="">-- Seleccionar producto --</option>
                                                </select>
                                            </td>
                                            <td class="px-2 py-1"><input type="number" id="v-cant-0" value="1" min="1" onchange="VentasView.recalcRow(0)" oninput="VentasView.recalcRow(0)" class="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-brand-400 focus:outline-none"></td>
                                            <td class="px-2 py-1"><input type="number" id="v-val-0" value="0" min="0" onchange="VentasView.recalcRow(0)" oninput="VentasView.recalcRow(0)" class="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-brand-400 focus:outline-none"></td>
                                            <td class="px-3 py-1 text-right font-medium text-gray-700" id="v-sub-0">$0</td>
                                            <td class="px-2 py-1 text-center"><button type="button" onclick="VentasView.removeRow(0)" class="text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash text-xs"></i></button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" onclick="VentasView.addRow()" class="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center gap-1 transition">
                                <i class="fa-solid fa-plus"></i> Agregar ítem
                            </button>
                        </div>

                        <!-- TOTALES -->
                        <div class="md:col-span-2 mt-4">
                            <div class="flex justify-end">
                                <div class="w-full max-w-sm space-y-2 text-sm">
                                    <div class="flex justify-between text-gray-600">
                                        <span>Subtotal:</span>
                                        <span id="v-total-subtotal" class="font-medium">$0</span>
                                    </div>
                                    <div class="flex justify-between items-center text-gray-600">
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" id="v-aplica-iva" onchange="VentasView.recalcTotals()" class="rounded">
                                            IVA (19%):
                                        </label>
                                        <span id="v-total-iva" class="font-medium">$0</span>
                                    </div>
                                    <div class="flex justify-between border-t border-gray-300 pt-2 font-bold text-gray-900 text-base">
                                        <span>Total a pagar:</span>
                                        <span id="v-total-final">$0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                        <button type="button" onclick="VentasView.render()" class="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancelar</button>
                        <button type="submit" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium shadow-sm transition flex items-center gap-2">
                            <i class="fa-solid fa-floppy-disk"></i> Guardar y Emitir
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    _rowCount: 1,

    renderFormCanon() {
        const fields = `
            <div class="md:col-span-2 mt-2">
                <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <i class="fa-solid fa-house text-brand-600"></i> Datos del Arrendamiento
                </h4>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Inmueble *</label>
                <select id="v-inmueble" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="">-- Seleccionar Inmueble --</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Periodo Facturado *</label>
                <input type="month" id="v-periodo" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Propietario</label>
                <input type="text" id="v-propietario" readonly placeholder="Se llena al seleccionar inmueble" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
            </div>
            <input type="hidden" id="v-tipo-doc" value="Canon de Arrendamiento">
        `;
        document.getElementById('ventas-form-container').innerHTML = this._wrapForm(
            'Canon de Arrendamiento', 'fa-house',
            'Factura mensual de arriendo de inmueble', fields
        );
        this._rowCount = 1;
        this._setToday();
        this._loadClientes();
        this._loadInmuebles();
        this._loadProductosIntoRows();
    },

    renderFormComision() {
        const fields = `
            <div class="md:col-span-2 mt-2">
                <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <i class="fa-solid fa-handshake text-brand-600"></i> Datos de Comisión
                </h4>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Comisión</label>
                <select id="v-tipo-comision" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="administracion">Administración de Inmueble</option>
                    <option value="venta">Venta de Inmueble</option>
                    <option value="arriendo">Intermediación de Arriendo</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Comisión (%)</label>
                <input type="number" id="v-porcentaje" step="0.5" min="0" max="100" value="8" onchange="VentasView.calcularComision()" oninput="VentasView.calcularComision()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Valor Base ($)</label>
                <input type="number" id="v-valor-base" min="0" value="0" onchange="VentasView.calcularComision()" oninput="VentasView.calcularComision()" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="Valor del inmueble o canon">
            </div>
            <div class="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                <i class="fa-solid fa-calculator text-brand-600 text-lg"></i>
                <div>
                    <p class="text-xs text-gray-500">Valor calculado de comisión:</p>
                    <p id="v-comision-calculada" class="font-bold text-brand-700 text-lg">$0</p>
                </div>
            </div>
            <input type="hidden" id="v-tipo-doc" value="Comisión Inmobiliaria">
        `;
        document.getElementById('ventas-form-container').innerHTML = this._wrapForm(
            'Comisión Inmobiliaria', 'fa-handshake',
            'Cobro de comisión por administración o venta', fields
        );
        this._rowCount = 1;
        this._setToday();
        this._loadClientes();
        this._loadProductosIntoRows();
    },

    renderFormComprobante() {
        const fields = `
            <div class="md:col-span-2 mt-2">
                <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <i class="fa-solid fa-receipt text-brand-600"></i> Datos del Pago
                </h4>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select id="v-metodo-pago" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Referencia de Factura</label>
                <input type="text" id="v-referencia-pago" placeholder="Ej: FV-9228" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <input type="hidden" id="v-tipo-doc" value="Comprobante de Pago">
        `;
        document.getElementById('ventas-form-container').innerHTML = this._wrapForm(
            'Comprobante de Pago', 'fa-receipt',
            'Confirmación de pago recibido del cliente', fields, false
        );
        this._rowCount = 1;
        this._setToday();
        this._loadClientes();
        this._loadProductosIntoRows();
    },

    renderFormElectronico() {
        const fields = `
            <div class="md:col-span-2 mt-2">
                <h4 class="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <i class="fa-solid fa-mobile-screen text-brand-600"></i> Datos del Pago Digital
                </h4>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Banco / Plataforma</label>
                <select id="v-banco-pago" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">N° Comprobante Bancario</label>
                <input type="text" id="v-referencia-pago" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="Número de autorización o referencia">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago *</label>
                <input type="date" id="v-fecha-pago" required class="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
            </div>
            <input type="hidden" id="v-tipo-doc" value="Pago Electrónico">
        `;
        document.getElementById('ventas-form-container').innerHTML = this._wrapForm(
            'Pago Electrónico', 'fa-mobile-screen',
            'Registro de pagos digitales y transferencias', fields, false
        );
        this._rowCount = 1;
        this._setToday();
        this._loadClientes();
        this._loadProductosIntoRows();
    },

    renderFormServicios() {
        const fields = `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio</label>
                <select id="v-tipo-servicio" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none">
                    <option value="Estudio de crédito">Estudio de crédito</option>
                    <option value="Gastos administrativos">Gastos administrativos</option>
                    <option value="Certificación">Certificación</option>
                    <option value="Elaboración de contrato">Elaboración de contrato</option>
                    <option value="Avalúo de inmueble">Avalúo de inmueble</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
            <input type="hidden" id="v-tipo-doc" value="Factura de servicios adicionales">
        `;
        document.getElementById('ventas-form-container').innerHTML = this._wrapForm(
            'Factura de Servicios Adicionales', 'fa-file-invoice',
            'Cobros complementarios del servicio inmobiliario', fields
        );
        this._rowCount = 1;
        this._setToday();
        this._loadClientes();
        this._loadProductosIntoRows();
    },

    // ─── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Consulta el próximo número de factura al servidor según el tipo de documento
     * actualmente seleccionado y lo muestra en el campo 'v-numero-factura'.
     * No modifica el contador, solo previsualiza.
     */
    async _actualizarNumeroPreview() {
        const tipoEl = document.getElementById('v-tipo-doc');
        if (!tipoEl) return;
        const tipo = tipoEl.value || 'Factura de servicios adicionales';

        const el = document.getElementById('v-numero-factura');
        if (!el) return;

        try {
            el.value = 'Cargando...';
            const res = await fetch(`/api/facturas/preview-numero?tipo=${encodeURIComponent(tipo)}`);
            const data = await res.json();
            el.value = data.numero || '---';
        } catch (e) {
            el.value = 'Error';
            console.warn('No se pudo obtener preview de número:', e);
        }
    },

    _setToday() {
        const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const el = document.getElementById('v-fecha');
        if (el) el.value = today;
    },

    async _loadClientes() {
        const clientes = await Store.getClientes();
        const sel = document.getElementById('v-cliente');
        if (!sel) return;
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            opt.dataset.nit = c.nit || '';
            opt.dataset.telefono = c.telefono || '';
            opt.dataset.correo = c.correo || '';
            sel.appendChild(opt);
        });
    },

    // Cache products for use in all rows
    _productosCache: [],

    async _loadProductosIntoRows() {
        if (this._productosCache.length === 0) {
            this._productosCache = await Store.getProductos();
        }
        // Populate all existing product selects on the form
        const allSelects = document.querySelectorAll('[id^="v-desc-"]');
        allSelects.forEach(sel => {
            if (sel.tagName !== 'SELECT') return;
            // Keep placeholder
            sel.innerHTML = '<option value="">-- Seleccionar producto --</option>';
            this._productosCache.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.nombre;
                opt.textContent = `${p.codigo} - ${p.nombre}`;
                opt.dataset.precio = p.precio_venta || 0;
                sel.appendChild(opt);
            });
        });
    },

    onProductoChange(idx) {
        const sel = document.getElementById(`v-desc-${idx}`);
        if (!sel) return;
        const opt = sel.options[sel.selectedIndex];
        const precio = parseFloat(opt?.dataset?.precio || 0);
        const valEl = document.getElementById(`v-val-${idx}`);
        if (valEl) {
            valEl.value = precio;
            this.recalcRow(idx);
        }
    },

    async _loadInmuebles() {
        try {
            const inmuebles = await Store.getInmuebles();
            const sel = document.getElementById('v-inmueble');
            if (!sel) return;
            const clientes = await Store.getClientes();
            inmuebles.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.id;
                opt.textContent = `${i.tipo || 'Inmueble'} - ${i.direccion}`;
                opt.dataset.clienteId = i.clienteId || '';
                const propietario = clientes.find(c => c.id === i.clienteId);
                opt.dataset.propietario = propietario ? propietario.nombre : '';
                sel.appendChild(opt);
            });

            sel.addEventListener('change', () => {
                const opt = sel.options[sel.selectedIndex];
                const propEl = document.getElementById('v-propietario');
                if (propEl) propEl.value = opt.dataset.propietario || '';
            });
        } catch (e) { console.warn('Error cargando inmuebles', e); }
    },

    onClienteChange() {
        const sel = document.getElementById('v-cliente');
        if (!sel) return;
        const opt = sel.options[sel.selectedIndex];
        const nitEl    = document.getElementById('v-nit');
        const telEl    = document.getElementById('v-telefono');
        const correoEl = document.getElementById('v-correo');
        if (nitEl)    nitEl.value    = opt.dataset.nit    || '';
        if (telEl)    telEl.value    = opt.dataset.telefono || '';
        if (correoEl) correoEl.value = opt.dataset.correo  || '';
    },

    calcularComision() {
        const pct  = parseFloat(document.getElementById('v-porcentaje')?.value || 0);
        const base = parseFloat(document.getElementById('v-valor-base')?.value || 0);
        const comision = (base * pct) / 100;
        const el = document.getElementById('v-comision-calculada');
        if (el) el.textContent = formatMoney(comision);

        // Fill first item
        const descEl = document.getElementById('v-desc-0');
        const valEl  = document.getElementById('v-val-0');
        if (descEl) {
            const tipo = document.getElementById('v-tipo-comision')?.value || 'administración';
            descEl.value = `Comisión por ${tipo} de inmueble ${pct}%`;
        }
        if (valEl) {
            valEl.value = comision;
            this.recalcRow(0);
        }
    },

    addRow() {
        const idx = this._rowCount++;
        const tbody = document.getElementById('v-items-body');
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.id = `v-row-${idx}`;
        // Build options from cache
        const opts = this._productosCache.map(p =>
            `<option value="${p.nombre}" data-precio="${p.precio_venta || 0}">${p.codigo} - ${p.nombre}</option>`
        ).join('');
        tr.innerHTML = `
            <td class="px-2 py-1">
                <select id="v-desc-${idx}" onchange="VentasView.onProductoChange(${idx})" class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-brand-400 focus:outline-none">
                    <option value="">-- Seleccionar producto --</option>
                    ${opts}
                </select>
            </td>
            <td class="px-2 py-1"><input type="number" id="v-cant-${idx}" value="1" min="1" onchange="VentasView.recalcRow(${idx})" oninput="VentasView.recalcRow(${idx})" class="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-brand-400 focus:outline-none"></td>
            <td class="px-2 py-1"><input type="number" id="v-val-${idx}" value="0" min="0" onchange="VentasView.recalcRow(${idx})" oninput="VentasView.recalcRow(${idx})" class="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-1 focus:ring-brand-400 focus:outline-none"></td>
            <td class="px-3 py-1 text-right font-medium text-gray-700" id="v-sub-${idx}">$0</td>
            <td class="px-2 py-1 text-center"><button type="button" onclick="VentasView.removeRow(${idx})" class="text-red-400 hover:text-red-600 transition"><i class="fa-solid fa-trash text-xs"></i></button></td>
        `;
        tbody.appendChild(tr);
    },

    removeRow(idx) {
        const tr = document.getElementById(`v-row-${idx}`);
        if (tr) tr.remove();
        this.recalcTotals();
    },

    recalcRow(idx) {
        const cant = parseFloat(document.getElementById(`v-cant-${idx}`)?.value || 0);
        const val  = parseFloat(document.getElementById(`v-val-${idx}`)?.value  || 0);
        const sub  = cant * val;
        const subEl = document.getElementById(`v-sub-${idx}`);
        if (subEl) subEl.textContent = formatMoney(sub);
        this.recalcTotals();
    },

    recalcTotals() {
        let subtotal = 0;
        document.querySelectorAll('[id^="v-cant-"]').forEach(cantEl => {
            const idx = cantEl.id.split('-').pop();
            const cant = parseFloat(cantEl.value || 0);
            const val  = parseFloat(document.getElementById(`v-val-${idx}`)?.value || 0);
            subtotal += cant * val;
        });

        const aplicaIva = document.getElementById('v-aplica-iva')?.checked;
        const iva    = aplicaIva ? subtotal * 0.19 : 0;
        const total  = subtotal + iva;

        const stEl = document.getElementById('v-total-subtotal');
        const ivaEl = document.getElementById('v-total-iva');
        const totEl = document.getElementById('v-total-final');
        if (stEl)  stEl.textContent  = formatMoney(subtotal);
        if (ivaEl) ivaEl.textContent = formatMoney(iva);
        if (totEl) totEl.textContent = formatMoney(total);
    },

    // ─── Save ──────────────────────────────────────────────────────────────────

    async guardar(event) {
        event.preventDefault();

        const clienteSel = document.getElementById('v-cliente');
        const clienteOpt = clienteSel?.options[clienteSel.selectedIndex];
        const clienteNombre = clienteOpt?.textContent || '';
        const clienteId   = clienteSel?.value || null;
        const nit         = document.getElementById('v-nit')?.value || '';
        const telefono    = document.getElementById('v-telefono')?.value || '';
        const correo      = document.getElementById('v-correo')?.value || '';
        const fecha       = document.getElementById('v-fecha')?.value || '';
        const estado      = document.getElementById('v-estado')?.value || 'emitida';
        const tipoDoc     = document.getElementById('v-tipo-doc')?.value || 'Factura de servicios adicionales';
        const inmuebleId  = document.getElementById('v-inmueble')?.value || null;
        const periodo     = document.getElementById('v-periodo')?.value || null;
        // Medio de pago: prioritize global selector, fallback to comprobante-specific ones
        const metodoPago  = document.getElementById('v-metodo-pago-global')?.value ||
                            document.getElementById('v-metodo-pago')?.value ||
                            document.getElementById('v-banco-pago')?.value || null;
        const fechaPago   = document.getElementById('v-fecha-pago-global')?.value || null;
        const referencia  = document.getElementById('v-referencia-pago')?.value || null;
        const banco       = document.getElementById('v-banco-pago')?.value || null;
        const porcentaje  = parseFloat(document.getElementById('v-porcentaje')?.value || 0) || null;
        const aplicaIva   = document.getElementById('v-aplica-iva')?.checked;

        // Build items
        const items = [];
        document.querySelectorAll('[id^="v-cant-"]').forEach(cantEl => {
            const idx  = cantEl.id.split('-').pop();
            const descEl = document.getElementById(`v-desc-${idx}`);
            // Support both select (product picker) and text input (legacy)
            let desc = '';
            let codigo = tipoDoc.substring(0, 6).toUpperCase();
            if (descEl && descEl.tagName === 'SELECT') {
                const opt = descEl.options[descEl.selectedIndex];
                desc = opt?.value || '';
                // Extract code from "ARR-01 - Canon de..." format
                const optText = opt?.textContent || '';
                if (optText.includes(' - ')) codigo = optText.split(' - ')[0].trim();
            } else {
                desc = descEl?.value || '';
            }
            const cant = parseFloat(cantEl.value || 1);
            const val  = parseFloat(document.getElementById(`v-val-${idx}`)?.value || 0);
            const sub  = cant * val;
            if (desc || val > 0) {
                items.push({ codigo, descripcion: desc, cantidad: cant, valorUnitario: val, total: sub });
            }
        });

        if (items.length === 0) { showToast('⚠️ Agrega al menos un ítem al documento', 'error'); return; }

        let subtotal = items.reduce((s, i) => s + i.total, 0);
        const iva = aplicaIva ? subtotal * 0.19 : 0;
        const total = subtotal + iva;

        // Auto-generate description for canon arriendo
        if (tipoDoc === 'Canon de Arrendamiento' && periodo && items[0]) {
            const [yr, mo] = periodo.split('-');
            const mes = new Date(yr, parseInt(mo)-1, 1).toLocaleString('es-CO', { month: 'long' });
            if (!items[0].descripcion) {
                const inmuelSel = document.getElementById('v-inmueble');
                const inmOpt = inmuelSel?.options[inmuelSel.selectedIndex];
                items[0].descripcion = `Canon de arrendamiento ${inmOpt?.textContent || ''} mes de ${mes} ${yr}`;
            }
        }

        const factura = {
            fecha, clienteId, cliente: clienteNombre, nit,
            contacto: [telefono, correo].filter(Boolean).join(' '),
            total, estado, tipo_documento: tipoDoc,
            inmuebleId, periodo_facturado: periodo,
            metodo_pago: metodoPago, referencia_pago: referencia,
            banco_pago: banco, porcentaje_comision: porcentaje,
            fecha_pago: fechaPago,
            items
        };

        try {
            // El servidor retorna el objeto con numero_factura generado
            const resultado = await Store.addFactura(factura);
            const numero = resultado.numero_factura || resultado.id || '';
            showToast(`✅ ${tipoDoc} emitida — N° ${numero}`);
            window.location.hash = '#historial';
        } catch (e) {
            console.error(e);
            showToast('Error al guardar el documento', 'error');
        }
    }
};
