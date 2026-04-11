from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_connection, release_connection
from spyne import Application
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.utils import secure_filename
import os
import psycopg2
from psycopg2 import pool
import uuid
import json
import traceback  

from soap_service import FIRService
from auth import authenticate_user, generate_token, verify_token
from services import (
    create_fir,
    update_fir_status,
    upload_evidence,
    add_fir_witness,
    add_fir_criminal,
    get_fir_details,
    get_criminal_relations,
    get_all_firs,
    get_all_criminals,
    get_witnesses_by_fir,
    get_evidence_by_fir,
    create_criminal,
    update_criminal,     
    get_criminal_full_details,    
    get_provinces,
    get_cities_by_province,
    get_stations_by_city,
    get_firs_by_citizen,
    get_fir_status_history,
    get_completed_firs,
    get_criminals_for_fir,
    get_most_wanted_criminals,
    get_pending_investigations,
    get_family_tree,
    get_officer_rank,
    get_citizens,
    get_family_crime_history
)
import models

app = Flask(__name__)
CORS(app, origin=["https://testdeploy-8y237z83r-ahsanali48636-6946s-projects.vercel.app/"])

DATABASE_URL = os.getenv("DATABASE_URL")

conn_pool = psycopg2.pool.SimpleConnectionPool(1, 20, dsn=DATABASE_URL)

def get_connection():
    return conn_pool.getconn()

def release_connection(conn):
    conn_pool.putconn(conn)


def get_user_from_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    return verify_token(token)

# ------------------- REST API ROUTES -------------------

@app.route('/')
def home():
    return "FIR Backend Running 🚔"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = authenticate_user(data.get('email'), data.get('password'))
    if user:
        token = generate_token(user['user_id'], user['role'])
        return jsonify({'success': True, 'token': token, 'role': user['role']})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/categories', methods=['GET'])
def get_categories():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT category_id, category_name FROM CRIME_CATEGORIES ORDER BY category_id")
        rows = cur.fetchall()
        categories = [{'category_id': row[0], 'category_name': row[1]} for row in rows]
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_connection(conn)

# ------------------- FIRs -------------------
@app.route('/api/firs', methods=['GET'])
def list_firs():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        if not citizen_id:
            return jsonify({'error': 'Citizen record not found'}), 404
        firs = get_firs_by_citizen(citizen_id)
    else:
        firs = get_all_firs()
    return jsonify(firs)

@app.route('/api/fir/<int:fir_id>', methods=['GET'])
def get_fir(fir_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    details = get_fir_details(fir_id, user)
    if 'error' in details:
        return jsonify(details), 404
    return jsonify(details)

@app.route('/api/all-stations', methods=['GET'])
def get_all_stations_with_details():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT s.station_id, s.station_name, s.city_id, c.city_name, c.province_id, p.province_name
            FROM POLICE_STATIONS s
            JOIN CITIES c ON s.city_id = c.city_id
            JOIN PROVINCES p ON c.province_id = p.province_id
            ORDER BY p.province_id, c.city_id, s.station_id
        """)
        rows = cur.fetchall()
        stations = []
        for row in rows:
            stations.append({
                'station_id': row[0],
                'station_name': row[1],
                'city_id': row[2],
                'city_name': row[3],
                'province_id': row[4],
                'province_name': row[5]
            })
        return jsonify(stations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        release_connection(conn)


@app.route('/api/fir', methods=['POST'])
def create_fir_rest():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user['role'] not in ('Citizen', 'Officer'):
        return jsonify({'error': 'Forbidden'}), 403

    # Get form data (multipart)
    title = request.form.get('title')
    description = request.form.get('description')
    citizen_id = request.form.get('citizen_id')
    officer_id = request.form.get('officer_id')
    station_id = request.form.get('station_id')
    category_id = request.form.get('category_id')
    witnesses_json = request.form.get('witnesses', '[]')
    witnesses = json.loads(witnesses_json) if witnesses_json else []
    
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        if not citizen_id:
            return jsonify({'error': 'Citizen record not found'}), 404
    elif user['role'] == 'Officer' and not citizen_id:
        return jsonify({'error': 'citizen_id is required'}), 400

    # Build data dict
    data = {
        'title': title,
        'description': description,
        'citizen_id': int(citizen_id),
        'officer_id': int(officer_id),
        'station_id': int(station_id),
        'category_id': int(category_id)
    }

    # Process evidence files
    evidence_items = []
    evidence_count = int(request.form.get('evidence_count', 0))
    for i in range(evidence_count):
        desc = request.form.get(f'evidence_description_{i}')
        file = request.files.get(f'evidence_file_{i}')
        if file and desc:
            # Save file to static/evidence
            ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'bin'
            filename = secure_filename(f"evidence_{uuid.uuid4().hex[:8]}.{ext}")
            upload_dir = os.path.join('static', 'evidence')
            os.makedirs(upload_dir, exist_ok=True)
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)
            evidence_items.append({
                'description': desc,
                'file_path': f'/static/evidence/{filename}',
                'uploaded_by': data['officer_id']
            })

    result = create_fir(data, witnesses=witnesses, evidence_items=evidence_items)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 201


@app.route('/api/fir/<int:fir_id>/status', methods=['PUT'])
def update_status(fir_id):
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    result = update_fir_status(fir_id, data.get('status'), data.get('officer_id'), data.get('remarks'))
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result)

# ------------------- Witnesses -------------------
@app.route('/api/fir/<int:fir_id>/witnesses', methods=['GET'])
def get_witnesses(fir_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        fir = models.get_fir_by_id(fir_id)
        if not fir or fir['citizen_id'] != citizen_id:
            return jsonify({'error': 'Forbidden'}), 403
    witnesses = get_witnesses_by_fir(fir_id)
    return jsonify(witnesses)

@app.route('/api/witness', methods=['POST'])
def add_witness():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    result = add_fir_witness(data)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 201

# ------------------- Evidence -------------------
@app.route('/api/fir/<int:fir_id>/evidence', methods=['GET'])
def get_evidence(fir_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        fir = models.get_fir_by_id(fir_id)
        if not fir or fir['citizen_id'] != citizen_id:
            return jsonify({'error': 'Forbidden'}), 403
    evidence = get_evidence_by_fir(fir_id)
    return jsonify(evidence)

@app.route('/api/evidence', methods=['POST'])
def upload_evidence_rest():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    result = upload_evidence(data)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 201

# ------------------- Criminals -------------------
@app.route('/api/criminals', methods=['GET'])
def list_criminals():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403
    criminals = get_all_criminals()
    return jsonify(criminals)

@app.route('/api/criminal', methods=['POST'])
def create_criminal_rest():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403

    try:
        full_name = request.form.get('full_name')
        alias = request.form.get('alias')
        date_of_birth = request.form.get('date_of_birth')
        address = request.form.get('address')
        cnic = request.form.get('cnic')
        photo = request.files.get('photo')
        relations_json = request.form.get('relations')
        relations = json.loads(relations_json) if relations_json else None

        if not full_name:
            return jsonify({'error': 'Full name is required'}), 400
        if not cnic:
            return jsonify({'error': 'CNIC is required'}), 400

        photo_url = None
        if photo and photo.filename:
            ext = photo.filename.rsplit('.', 1)[1].lower() if '.' in photo.filename else 'jpg'
            filename = secure_filename(f"{full_name.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.{ext}")
            upload_dir = os.path.join('static', 'pics')
            os.makedirs(upload_dir, exist_ok=True)
            filepath = os.path.join(upload_dir, filename)
            photo.save(filepath)
            photo_url = f'/static/pics/{filename}'

        result = create_criminal(full_name, alias, date_of_birth, address, cnic, photo_url, relations)
        if 'error' in result:
            return jsonify(result), 500
        return jsonify(result), 201

    except Exception as e:
        # Return the actual error message for debugging
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

@app.route('/api/criminal/<int:criminal_id>', methods=['PUT'])
def update_criminal_rest(criminal_id):
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403

    full_name = request.form.get('full_name')
    alias = request.form.get('alias')
    date_of_birth = request.form.get('date_of_birth')
    address = request.form.get('address')
    cnic = request.form.get('cnic')
    photo = request.files.get('photo')
    relations_json = request.form.get('relations')
    relations = json.loads(relations_json) if relations_json else None

    if not full_name:
        return jsonify({'error': 'Full name is required'}), 400
    if not cnic:
        return jsonify({'error': 'CNIC is required'}), 400

    existing = get_criminal_full_details(criminal_id)
    if not existing:
        return jsonify({'error': 'Criminal not found'}), 404

    photo_url = existing['photo_url']
    if photo and photo.filename:
        ext = photo.filename.rsplit('.', 1)[1].lower() if '.' in photo.filename else 'jpg'
        filename = secure_filename(f"{full_name.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.{ext}")
        upload_dir = os.path.join('static', 'pics')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        photo.save(filepath)
        photo_url = f'/static/pics/{filename}'

    result = update_criminal(criminal_id, full_name, alias, date_of_birth, address, cnic, photo_url, relations)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 200


@app.route('/api/criminal/<int:criminal_id>/family-crime-history', methods=['GET'])
def family_crime_history(criminal_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    result = get_family_crime_history(criminal_id)
    if 'error' in result:
        return jsonify(result), 404
    return jsonify(result)

@app.route('/api/criminal/<int:criminal_id>', methods=['GET'])
def get_criminal(criminal_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    criminal = get_criminal_full_details(criminal_id)
    if not criminal:
        return jsonify({'error': 'Criminal not found'}), 404
    return jsonify(criminal)

@app.route('/api/criminal/<int:criminal_id>/relations', methods=['GET'])
def get_relations(criminal_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    relations = get_criminal_relations(criminal_id)
    return jsonify(relations)

@app.route('/api/fir/<int:fir_id>/criminals', methods=['GET'])
def get_fir_criminals(fir_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        fir = models.get_fir_by_id(fir_id)
        if not fir or fir['citizen_id'] != citizen_id:
            return jsonify({'error': 'Forbidden'}), 403
    criminals = get_criminals_for_fir(fir_id)
    return jsonify(criminals)

@app.route('/api/fir_criminal', methods=['POST'])
def link_criminal():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    result = add_fir_criminal(data)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 201

# ------------------- Completed Cases -------------------
@app.route('/api/firs/completed', methods=['GET'])
def get_completed_firs_route():
    user = get_user_from_token()
    if not user or user['role'] == 'Citizen':
        return jsonify({'error': 'Forbidden'}), 403
    completed = get_completed_firs()
    return jsonify(completed)

# ------------------- Status History -------------------
@app.route('/api/fir/<int:fir_id>/history', methods=['GET'])
def get_fir_history(fir_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        fir = models.get_fir_by_id(fir_id)
        if not fir or fir['citizen_id'] != citizen_id:
            return jsonify({'error': 'Forbidden'}), 403
    history = get_fir_status_history(fir_id)
    return jsonify(history)

# ------------------- Location Data -------------------
@app.route('/api/provinces', methods=['GET'])
def get_provinces_route():
    provinces = get_provinces()
    return jsonify(provinces)

@app.route('/api/cities/<int:province_id>', methods=['GET'])
def get_cities_route(province_id):
    cities = get_cities_by_province(province_id)
    return jsonify(cities)

@app.route('/api/stations/<int:city_id>', methods=['GET'])
def get_stations_route(city_id):
    stations = get_stations_by_city(city_id)
    return jsonify(stations)

# ------------------- Registration & Password Change -------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if data.get('role') != 'Citizen':
        return jsonify({'error': 'Only citizens can register through this endpoint'}), 400
    from services import register_user
    result = register_user(data)
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result), 201

@app.route('/api/change-password', methods=['POST'])
def change_password_route():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    from services import change_password
    result = change_password(user['user_id'], data.get('old_password'), data.get('new_password'))
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result), 200

# ------------------- Officer-specific -------------------
@app.route('/api/officer/rank', methods=['GET'])
def officer_rank():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Unauthorized'}), 401
    rank = get_officer_rank(user['user_id'])
    return jsonify({'rank': rank})

@app.route('/api/officer/pending-investigations', methods=['GET'])
def pending_investigations():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Unauthorized'}), 401
    result = get_pending_investigations(user['user_id'])
    return jsonify(result)

# ------------------- Most Wanted & Family Tree -------------------
@app.route('/api/most-wanted', methods=['GET'])
def get_most_wanted():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    result = get_most_wanted_criminals()
    return jsonify(result)

@app.route('/api/criminal/<int:criminal_id>/family-tree', methods=['GET'])
def family_tree(criminal_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    result = get_family_tree(criminal_id)
    return jsonify(result)

# ------------------- Citizens list (for criminal creation) -------------------
@app.route('/api/citizens', methods=['GET'])
def list_citizens():
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403
    citizens = get_citizens()
    return jsonify(citizens)

# ------------------- Delete Endpoints (Only Officers) -------------------
@app.route('/api/fir/<int:fir_id>', methods=['DELETE'])
def delete_fir_endpoint(fir_id):
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403
    from services import delete_fir
    result = delete_fir(fir_id)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 200

@app.route('/api/criminal/<int:criminal_id>', methods=['DELETE'])
def delete_criminal_endpoint(criminal_id):
    user = get_user_from_token()
    if not user or user['role'] != 'Officer':
        return jsonify({'error': 'Forbidden'}), 403
    from services import delete_criminal
    result = delete_criminal(criminal_id)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 200

# ------------------- Arrested Criminals -------------------
@app.route('/api/criminals/arrested', methods=['GET'])
def get_arrested_criminals_route():
    user = get_user_from_token()
    if not user or user['role'] not in ('Officer', 'Admin'):
        return jsonify({'error': 'Forbidden'}), 403
    from services import get_arrested_criminals
    arrested = get_arrested_criminals()
    return jsonify(arrested)

@app.route('/api/criminal/<int:criminal_id>/full-relations', methods=['GET'])
def get_criminal_full_relations(criminal_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    rows = models.get_criminal_relations_full(criminal_id)
    relations = {}
    for row in rows:
        cnic, full_name, alias, dob, address, rel_type = row
        relations[rel_type] = {'cnic': cnic, 'full_name': full_name, 'alias': alias, 'date_of_birth': dob, 'address': address}
    return jsonify(relations)



# ------------------- SOAP SETUP -------------------
spyne_app = Application(
    [FIRService],
    tns='http://fir.system/soap',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)
soap_app = WsgiApplication(spyne_app)
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {'/soap': soap_app})
    
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
