// static/js/app.js

const contentDisplay = document.getElementById('content-display');

// Función para generar un mensaje de error amigable
function renderError(status, detail) {
    contentDisplay.innerHTML = `
        <div style="padding: 20px; border: 1px solid #d9534f; background-color: #f2dede; color: #a94442; border-radius: 4px;">
            <h3>🚨 Error de Conexión: Código ${status}</h3>
            <p><strong>Detalle del error:</strong> ${detail}</p>
            <p>Parece que el sistema se está conectando correctamente a Nubarium, pero la API respondió con un error de permisos o credenciales. Por favor, verifica que tu cuenta esté activa y que tenga acceso al endpoint de Inventario.</p>
        </div>
    `;
}

// Función para renderizar los datos (si tuviéramos éxito)
function renderData(data) {
    // Nota: Esta es una función de ejemplo. Necesitarías la estructura de los datos de inventario real de Nubarium.
    
    // Si la respuesta es exitosa (código 200), pero está vacía o no tiene la estructura esperada:
    if (!data || data.length === 0) {
        contentDisplay.innerHTML = '<p>No se encontraron datos de inventario.</p>';
        return;
    }

    // Ejemplo de cómo construir una tabla (adaptar según la respuesta real de Nubarium)
    let html = '<h2>Inventario Actual</h2>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<thead><tr style="background-color: #4e6a00; color: white;">';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">SKU</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">Cantidad</th>';
    html += '</tr></thead><tbody>';

    // Esto simularía datos para la tabla si el 403 fuera un 200 (éxito)
    // Suponiendo que 'data' es un array de productos:
    /*
    data.forEach(item => {
        html += `<tr>`;
        html += `<td style="padding: 10px; border: 1px solid #ddd;">${item.sku}</td>`;
        html += `<td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>`;
        html += `<td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>`;
        html += `</tr>`;
    });
    */

    html += '<tr><td colspan="3" style="padding: 10px; text-align: center; border: 1px solid #ddd;">(Datos de ejemplo o la tabla real aparecería aquí)</td></tr>';
    html += '</tbody></table>';
    
    contentDisplay.innerHTML = html;
}

// Función principal para cargar contenido basado en la ruta
async function loadContent(route) {
    contentDisplay.innerHTML = '<p>Cargando datos...</p>';

    // Simular que el Dashboard es solo texto HTML
    if (route === 'dashboard') {
        contentDisplay.innerHTML = `
            <h2>Resumen del Sistema</h2>
            <p>Aquí se mostrarán gráficos y estadísticas clave del inventario una vez se obtenga acceso a la API.</p>
        `;
        return;
    }

    // Lógica para el Inventario (llamada a la API de Flask)
    if (route === 'inventario') {
        try {
            const response = await fetch('/api/inventario');
            const data = await response.json();

            if (response.ok) {
                // Si la respuesta es 200 OK
                renderData(data); 
            } else {
                // Si la respuesta es un error (400, 401, 403, 500, etc.)
                // data.detalle y response.status vienen de tu servidor Flask
                renderError(response.status, data.detalle || 'Error desconocido al consultar.'); 
            }
        } catch (error) {
            // Error de red (servidor Flask caído o problemas de conexión)
            renderError('Network', 'No se pudo conectar con el servidor interno de la aplicación.');
        }
        return;
    }
}

// Event Listeners para la navegación lateral
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

// Cargar el contenido inicial del Dashboard al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadContent('dashboard');
});