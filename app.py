# app.py
import requests
from flask import Flask, jsonify, render_template

# --- CONFIGURACIÓN DE NUBARIUM (¡REEMPLAZA ESTOS VALORES!) ---
NUBARIUM_API_BASE = "https://api.nubarium.com" 
USUARIO = "agricactus"
CONTRASENA = "3litTLEp1G5" 
# -----------------------------------------------------------
app = Flask(__name__)

# --- NUEVA FUNCIÓN: Obtener el Token JWT ---
# app.py (Función obtener_token_jwt CORREGIDA y FINAL)

def obtener_token_jwt():
    # Aseguramos la URL base
    NUBARIUM_API_BASE = "https://api.nubarium.com" # DEBE ESTAR CORRECTO
    url = f"{NUBARIUM_API_BASE}/global/account/v1/generate-jwt"
    
    # Payload que requiere la API (según tu código http.client)
    payload_dict = {"expireAfter": 3600} 
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(
            url, 
            json=payload_dict, 
            headers=headers,
            # Usamos Basic Auth para ENVIAR las credenciales junto al payload
            auth=(USUARIO, CONTRASENA) 
        )
        response.raise_for_status() 
        token_data = response.json()
        
        # --- AJUSTE CLAVE: Buscar el token en 'bearer_token' ---
        return token_data.get('bearer_token') 
        
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener JWT de Nubarium: {e}")
        return None

# --- NUEVA FUNCIÓN: Petición con el Token JWT ---
def obtener_datos_de_nubarium(endpoint):
    token = obtener_token_jwt()
    if not token:
        return {"error": "Fallo la autenticación", "detalle": "No se pudo obtener el token JWT."}

    # El endpoint debe incluir la versión API si es necesaria (ej: /v1/inventario)
    url = f"{NUBARIUM_API_BASE}/{endpoint}" 
    
    # El token debe ser enviado en el encabezado 'Authorization' con el prefijo 'Bearer'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con Nubarium en {url}: {e}")
        return {"error": "Error al consultar datos", "detalle": str(e)}


# ----------------- RUTAS DE LA API (BACKEND) -----------------
# Nota: El endpoint real podría ser /v1/inventario. Por favor, verifica la documentación.

@app.route('/api/inventario', methods=['GET'])
def get_inventario():
    # Asumiendo que el endpoint de inventario es /v1/inventario
    datos = obtener_datos_de_nubarium("v1/inventario") 
    return jsonify(datos)

# ----------------- RUTA PRINCIPAL (FRONTEND) -----------------

@app.route('/')
def index():
    # Sirve el archivo HTML principal de la PWA
    return render_template('index.html') 

if __name__ == '__main__':
    # Inicia el servidor
    app.run(debug=True, port=5000)
    # pwa-nubarium/app.py

# ... (código existente, incluyendo las rutas index y api_inventario)

@app.route('/api/validar_rfc', methods=['POST'])
def api_validar_rfc():
    try:
        # Obtener el RFC del cuerpo de la solicitud JSON enviada por el frontend
        data = request.get_json()
        rfc_a_validar = data.get('rfc')

        if not rfc_a_validar:
            return jsonify({'detalle': 'Falta el campo "rfc" en la solicitud.'}), 400

        # El código de Nubarium sugiere una conexión a 'rfc.nubarium.com'
        # y el path '/sat/valida_rfc' (o similar)
        # Adaptaremos esto al módulo 'requests' para mayor facilidad.

        # URL del servicio de validación de RFC
        url = "https://rfc.nubarium.com/sat/valida_rfc"
        
        # Payload (cuerpo de la solicitud)
        payload = json.dumps({
            "rfc": rfc_a_validar # Usamos el RFC que el usuario envió desde el frontend
        })

        # Encabezados (headers) - Es crucial para la autenticación en Nubarium
        # NOTA: Debes incluir aquí tu clave de autenticación si la API lo requiere.
        # Asumiremos que la API de validación funciona sin la clave, o la pide en el payload.
        # Si la pide en el header, deberás ajustarlo.
        headers = {
            'Content-Type': 'application/json'
        }

        # Realizar la solicitud POST a Nubarium
        response = requests.post(url, data=payload, headers=headers)
        
        # Devolver la respuesta de Nubarium al frontend (tal como viene)
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        # Manejo de errores de conexión de red
        print(f"Error de conexión con Nubarium: {e}")
        return jsonify({'detalle': f'Error de conexión de red con Nubarium: {e}'}), 503
    except Exception as e:
        # Manejo de errores internos
        print(f"Error interno: {e}")
        return jsonify({'detalle': f'Error interno del servidor: {e}'}), 500
