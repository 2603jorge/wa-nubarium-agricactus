// pwa-nubarium/static/js/app.js

const contentDisplay = document.getElementById('content-display');

// 1. Función para generar un mensaje de error amigable
function renderError(status, detail) {
    contentDisplay.innerHTML = `
        <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px;">
            <h3>🚨 Error de Conexión: Código ${status}</h3>
            <p><strong>Detalle del error:</strong> ${detail}</p>
            <p>Verifica tu conexión y, si el error persiste, revisa que tus credenciales de la API de Nubarium sean correctas.</p>
        </div>
    `;
}

// 2. Función para renderizar los datos (si tuviéramos éxito en Inventario)
function renderData(data) {
    // Si la respuesta es exitosa (código 200), pero está vacía o no tiene la estructura esperada:
    if (!data || data.length === 0) {
        contentDisplay.innerHTML = '<p>No se encontraron datos de inventario.</p>';
        return;
    }

    let html = '<h2>Inventario Actual</h2>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<thead><tr style="background-color: #4e6a00; color: white;">';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">SKU</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Cantidad</th>';
    html += '</tr></thead><tbody>';

    // Esto solo muestra una fila de ejemplo, ya que la API te devuelve 403.
    // Cuando la API funcione, se reemplazaría por un loop real (data.forEach(...)).
    html += '<tr><td colspan="3" style="padding: 10px; text-align: center; border: 1px solid #ddd;">(Datos de ejemplo o la tabla real aparecería aquí)</td></tr>';
    
    html += '</tbody></table>';
    
    contentDisplay.innerHTML = html;
}

// 3. Función principal para cargar contenido basado en la ruta (Dashboard, Inventario, Validar RFC)
async function loadContent(route) {
    contentDisplay.innerHTML = '<p>Cargando datos...</p>';

    // --- DASHBOARD ---
    if (route === 'dashboard') {
        contentDisplay.innerHTML = `
            <h2>Resumen del Sistema</h2>
            <p>Bienvenido a Agricactus. Usa el menú lateral para consultar datos.</p>
        `;
        return;
    }

    // --- INVENTARIO (Ruta /api/inventario) ---
    if (route === 'inventario') {
        try {
            const response = await fetch('/api/inventario');
            const data = await response.json();

            if (response.ok) {
                renderData(data); 
            } else {
                renderError(response.status, data.detalle || 'Error desconocido al consultar.'); 
            }
        } catch (error) {
            renderError('Network', 'No se pudo conectar con el servidor interno de la aplicación.');
        }
        return;
    }

    // --- VALIDAR RFC (Ruta /api/validar_rfc) ---
    if (route === 'validar-rfc') {
        contentDisplay.innerHTML = `
            <h2>Validación de RFC</h2>
            <div id="rfc-form-container" style="max-width: 400px; margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                <p>Ingrese el RFC a validar:</p>
                <input type="text" id="rfc-input" placeholder="Ej: XAXX010101000" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 3px;">
                <button id="submit-rfc" style="width: 100%; padding: 10px; background-color: #4e6a00; color: white; border: none; border-radius: 3px; cursor: pointer;">Validar</button>
                <div id="rfc-result" style="margin-top: 20px; padding: 10px; border: 1px solid #eee; background-color: white; min-height: 50px;">Esperando RFC...</div>
            </div>
        `;
        
        // Agregar el listener al botón de Validar
        document.getElementById('submit-rfc').addEventListener('click', async () => {
            const rfcInput = document.getElementById('rfc-input').value.trim();
            const resultDiv = document.getElementById('rfc-result');
            
            if (rfcInput) {
                resultDiv.innerHTML = 'Validando con Nubarium...';
                try {
                    const response = await fetch('/api/validar_rfc', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ rfc: rfcInput })
                    });

                    const result = await response.json();
                    
                    // Mostrar el resultado JSON en formato amigable
                    resultDiv.innerHTML = `
                        <h4>Resultado (${response.status})</h4>
                        <pre style="white-space: pre-wrap; word-wrap: break-word; background-color: #f1f1f1; padding: 10px; border-radius: 4px;">${JSON.stringify(result, null, 2)}</pre>
                    `;
                } catch (error) {
                    resultDiv.innerHTML = '<p style="color: red;">Error: No se pudo conectar con el servidor de Flask.</p>';
                }
            } else {
                resultDiv.innerHTML = 'Por favor, ingrese un RFC válido.';
            }
        });
        
        return;
    }
}

// 4. Event Listeners para la navegación lateral
document.querySelectorAll('#sidebar nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        
        // Remover 'active' de todos y agregar al clickeado
        document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');

        loadContent(route);
    });
});

// 5. Cargar el contenido inicial del Dashboard al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadContent('dashboard');
});
