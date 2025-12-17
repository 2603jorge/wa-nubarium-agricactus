from flask import Flask, jsonify, render_template, request
import requests
import json # <--- ¡CRUCIAL! Aseguramos que 'json' esté importado.

# --- CONFIGURACIÓN DE NUBARIUM ---
NUBARIUM_API_BASE = "https://api.nubarium.com"
USUARIO = "agricactus"
CONTRASENA = "3litTLEp1G5"
# ---------------------------------
app = Flask(__name__)

# --- FUNCIÓN 1: Obtener el Token JWT (Usa la autenticación Basic) ---
def obtener_token_jwt():
    url = f"{NUBARIUM_API_BASE}/global/account/v1/generate-jwt"
    
    # Payload que requiere la API de Nubarium
    payload_dict = {"expireAfter": 3600} 
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(
            url, 
            json=payload_dict, 
            headers=headers,
            # Usamos Basic Auth para ENVIAR las credenciales
            auth=(USUARIO, CONTRASENA),
            timeout=10 # Añadimos un timeout para evitar que se cuelgue
        )
        response.raise_for_status() # Lanza excepción si la respuesta es 4xx o 5xx
        token_data = response.json()
        
        # El token debe venir en 'bearer_token'
        return token_data.get('bearer_token') 
        
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener JWT de Nubarium: {e}")
        return None

# --- FUNCIÓN 2: Petición con el Token JWT (Para inventario, requiere autenticación) ---
def obtener_datos_con_token(endpoint):
    token = obtener_token_jwt()
    if not token:
        return {"error": "Fallo la autenticación", "detalle": "No se pudo obtener el token JWT."}

    # Construir la URL completa para el endpoint, ej: https://api.nubarium.com/v1/inventario
    url = f"{NUBARIUM_API_BASE}/{endpoint}" 
    
    # El token se envía en el encabezado 'Authorization'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        # Si la API devuelve un error (ej. 403), lo devolvemos con el JSON de error
        if response.status_code >= 400:
            return response.json(), response.status_code
            
        return response.json(), response.status_code
        
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con Nubarium en {url}: {e}")
        return {"error": "Error al consultar datos", "detalle": str(e)}, 503


# ----------------- RUTAS DE LA APLICACIÓN -----------------

@app.route('/')
def index():
    """Ruta principal: Sirve el archivo HTML de la PWA."""
    return render_template('index.html')

@app.route('/api/inventario', methods=['GET'])
def get_inventario():
    """Ruta para Inventario: Requiere autenticación JWT."""
    # Asumiendo que el endpoint de inventario es v1/inventario
    datos, status_code = obtener_datos_con_token("v1/inventario") 
    return jsonify(datos), status_code

@app.route('/api/validar_rfc', methods=['POST'])
def api_validar_rfc():
    """Ruta para Validar RFC: Petición POST directa a rfc.nubarium.com/sat/valida_rfc."""
    try:
        # 1. Obtener datos del frontend (el RFC)
        data = request.get_json()
        rfc_a_validar = data.get('rfc')

        if not rfc_a_validar:
            return jsonify({'detalle': 'Falta el campo "rfc" en la solicitud.'}), 400

        # 2. Configurar la petición a Nubarium (basado en el ejemplo http.client)
        # NOTA: Esta URL es diferente a la de los servicios de token/inventario
        url = "https://rfc.nubarium.com/sat/valida_rfc"
        
        # 3. Payload: Usamos json=data para que requests lo maneje directamente
        payload_dict = {"rfc": rfc_a_validar} 

        headers = {'Content-Type': 'application/json'}

        # 4. Realizar la solicitud POST
        # Usamos json=payload_dict en lugar de data=json.dumps(...)
        response = requests.post(url, json=payload_dict, headers=headers, timeout=10)
        
        # 5. Devolver la respuesta de Nubarium
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        # Error de red o timeout
        print(f"Error de conexión con Nubarium: {e}")
        return jsonify({'detalle': f'Error de conexión de red o timeout con Nubarium: {e}'}), 503
    except Exception as e:
        # Error interno (Capturaremos el error real)
        import traceback
        traceback.print_exc()
        return jsonify({'detalle': f'Error interno del servidor (Revisar logs): {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
