import uuid
from database import get_connection, release_connection
import models
from auth import hash_password

def create_fir(data, witnesses=None, evidence_items=None, criminals=None):
    conn = get_connection()
    try:
        fir_number = 'FIR-' + str(uuid.uuid4())[:8]
        fir_id = models.insert_fir(
            fir_number, data['title'], data['description'],
            data['citizen_id'], data['officer_id'], data['station_id'],
            data['category_id'], conn
        )
        models.insert_status_history(fir_id, 'Filed', data['officer_id'], 'FIR created', conn)

        if criminals:
            for crim in criminals:
                models.add_criminal_to_fir(fir_id, crim['criminal_id'], crim['role'], conn)
                for rel in crim.get('family_relations', []):
                    models.insert_criminal_relation(
                        rel['cnic'], rel['full_name'], rel['alias'],
                        rel['date_of_birth'], rel['address'],
                        crim['criminal_id'], rel['relationship_type'], conn
                    )

        if witnesses:
            for witness in witnesses:
                models.add_witness(fir_id, witness['full_name'], witness['contact_info'], witness['statement'], conn)

        if evidence_items:
            for evidence in evidence_items:
                models.add_evidence(fir_id, evidence['description'], evidence['file_path'], evidence['uploaded_by'], conn)

        models.insert_audit_log(data['officer_id'], 'INSERT', 'FIR', fir_id, conn)
        conn.commit()
        return {'message': 'FIR created', 'fir_id': str(fir_id), 'fir_number': fir_number}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'create_fir failed: {e}\n')
        return {'error': 'Transaction rolled back'}
    finally:
        release_connection(conn)

def get_arrested_criminals():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT c.criminal_id, c.full_name, c.alias, c.photo_url, 
                   fc.arrest_status, f.fir_number, f.title, f.status as fir_status,
                   s.station_name, s.station_id, ci.city_id, ci.city_name, p.province_id, p.province_name
            FROM CRIMINALS c
            JOIN FIR_CRIMINALS fc ON c.criminal_id = fc.criminal_id
            JOIN FIR f ON fc.fir_id = f.fir_id
            JOIN POLICE_STATIONS s ON f.station_id = s.station_id
            JOIN CITIES ci ON s.city_id = ci.city_id
            JOIN PROVINCES p ON ci.province_id = p.province_id
            WHERE fc.arrest_status = 'Arrested' AND f.status = 'Completed'
            ORDER BY c.criminal_id
        """)
        rows = cur.fetchall()
        result = []
        for row in rows:
            result.append({
                'criminal_id': row[0],
                'full_name': row[1],
                'alias': row[2] if row[2] else '',
                'photo_url': row[3] if row[3] else None,
                'arrest_status': row[4],
                'fir_number': row[5],
                'fir_title': row[6],
                'fir_status': row[7],
                'station_name': row[8],
                'station_id': row[9],
                'city_id': row[10],
                'city_name': row[11],
                'province_id': row[12],
                'province_name': row[13]
            })
        return result
    except Exception as e:
        print(f"Error in get_arrested_criminals: {e}")
        return []
    finally:
        release_connection(conn)

def upload_evidence(data):
    conn = get_connection()
    try:
        models.add_evidence(data['fir_id'], data['description'], data['file_path'], data['uploaded_by'], conn)
        models.insert_audit_log(data['uploaded_by'], 'INSERT', 'EVIDENCE', data['fir_id'], conn)
        conn.commit()
        return {'message': 'Evidence uploaded'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'upload_evidence failed: {e}\n')
        return {'error': 'Transaction rolled back'}
    finally:
        release_connection(conn)

def add_fir_witness(data):
    conn = get_connection()
    try:
        models.add_witness(data['fir_id'], data['full_name'], data['contact_info'], data['statement'], conn)
        conn.commit()
        return {'message': 'Witness added'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'add_fir_witness failed: {e}\n')
        return {'error': 'Transaction rolled back'}
    finally:
        release_connection(conn)

def add_fir_criminal(data):
    conn = get_connection()
    try:
        models.add_criminal_to_fir(data['fir_id'], data['criminal_id'], data['role'], conn)
        conn.commit()
        return {'message': 'Criminal linked'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'add_fir_criminal failed: {e}\n')
        return {'error': 'Transaction rolled back'}
    finally:
        release_connection(conn)

def get_fir_details(fir_id, user):
    fir = models.get_fir_by_id(fir_id)
    if not fir:
        return {'error': 'FIR not found'}
    if user['role'] == 'Citizen':
        citizen_id = models.get_citizen_id_by_user_id(user['user_id'])
        if not citizen_id or fir['citizen_id'] != citizen_id:
            return {'error': 'You can only view your own FIRs'}
    return {
        'fir_number': fir['fir_number'],
        'title': fir['title'],
        'description': fir['description'],
        'status': fir['status'],
        'date_filed': str(fir['date_filed']),
        'citizen_name': fir['citizen_name'],
        'station_name': fir['station_name'],
        'officer_badge': fir['officer_badge'],
        'category_name': fir['category_name'],
        'citizen_id': fir['citizen_id'],
        'station_id': fir['station_id'],
        'officer_id': fir['officer_id'],
        'category_id': fir['category_id']
    }

def get_all_firs():
    rows = models.get_all_firs()
    result = []
    for row in rows:
        result.append({
            'fir_id': row[0],
            'fir_number': row[1],
            'title': row[2],
            'status': row[3],
            'date_filed': str(row[4]) if row[4] else None,
            'station_id': row[5],
            'station_name': row[6],
            'city_id': row[7],
            'city_name': row[8],
            'province_id': row[9],
            'province_name': row[10]
        })
    return result

def get_all_criminals():
    rows = models.get_all_criminals()
    result = []
    for row in rows:
        result.append({
            'criminal_id': row[0],
            'full_name': row[1],
            'alias': row[2] if row[2] else '',
            'address': row[3] if row[3] else '',
            'photo_url': row[4] if row[4] else None,
            'cnic': row[5]
        })
    return result

def get_witnesses_by_fir(fir_id):
    rows = models.get_witnesses_by_fir(fir_id)
    result = []
    for row in rows:
        result.append({
            'witness_id': row[0],
            'full_name': row[1],
            'statement': row[2] if row[2] else ''
        })
    return result

def get_evidence_by_fir(fir_id):
    rows = models.get_evidence_by_fir(fir_id)
    result = []
    for row in rows:
        result.append({
            'evidence_id': row[0],
            'description': row[1],
            'file_path': row[2]
        })
    return result

# Location data
def get_provinces():
    rows = models.get_all_provinces()
    return [{'province_id': r[0], 'province_name': r[1]} for r in rows]

def get_cities_by_province(province_id):
    rows = models.get_cities_by_province(province_id)
    return [{'city_id': r[0], 'city_name': r[1]} for r in rows]

def get_stations_by_city(city_id):
    rows = models.get_stations_by_city(city_id)
    return [{'station_id': r[0], 'station_name': r[1]} for r in rows]

# Delete functions
def delete_fir(fir_id):
    conn = get_connection()
    try:
        models.delete_fir(fir_id, conn)
        conn.commit()
        return {'message': 'FIR deleted'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'delete_fir failed: {e}\n')
        return {'error': 'Deletion failed'}
    finally:
        release_connection(conn)

def delete_criminal(criminal_id):
    conn = get_connection()
    try:
        models.delete_criminal(criminal_id, conn)
        conn.commit()
        return {'message': 'Criminal deleted'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'delete_criminal failed: {e}\n')
        return {'error': 'Deletion failed'}
    finally:
        release_connection(conn)

def get_most_wanted_criminals():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.criminal_id, c.full_name, c.photo_url,
                   COUNT(fc.fir_id) as case_count,
                   array_agg(DISTINCT f.fir_id) as fir_ids,
                   array_agg(DISTINCT f.fir_number) as fir_numbers,
                   array_agg(DISTINCT f.title) as fir_titles,
                   array_agg(DISTINCT f.status) as fir_statuses
            FROM CRIMINALS c
            JOIN FIR_CRIMINALS fc ON c.criminal_id = fc.criminal_id
            JOIN FIR f ON fc.fir_id = f.fir_id
            WHERE f.status IN ('Filed', 'Under Investigation')
            GROUP BY c.criminal_id, c.full_name, c.photo_url
            ORDER BY case_count DESC
            LIMIT 2
        """)
        rows = cur.fetchall()
        result = []
        for row in rows:
            criminal = {
                'criminal_id': row[0],
                'full_name': row[1],
                'photo_url': row[2],
                'case_count': row[3],
                'firs': []
            }
            for i in range(len(row[4])):
                criminal['firs'].append({
                    'fir_id': row[4][i],
                    'fir_number': row[5][i],
                    'title': row[6][i],
                    'status': row[7][i]
                })
            result.append(criminal)
        return result
    except Exception as e:
        print(f"Error in get_most_wanted: {e}")
        return []
    finally:
        release_connection(conn)

def get_firs_by_citizen(citizen_id):
    rows = models.get_firs_by_citizen(citizen_id)
    result = []
    for row in rows:
        result.append({
            'fir_id': row[0],
            'fir_number': row[1],
            'title': row[2],
            'status': row[3],
            'date_filed': str(row[4]) if row[4] else None,
            'station_id': row[5],
            'station_name': row[6],
            'city_id': row[7],
            'city_name': row[8],
            'province_id': row[9],
            'province_name': row[10]
        })
    return result

def get_criminals_for_fir(fir_id):
    rows = models.get_criminals_by_fir(fir_id)
    result = []
    for row in rows:
        result.append({
            'criminal_id': row[0],
            'full_name': row[1],
            'alias': row[2] if row[2] else '',
            'photo_url': row[3] if row[3] else None,
            'role': row[4]
        })
    return result

def get_fir_status_history(fir_id):
    rows = models.get_status_history(fir_id)
    result = []
    for row in rows:
        result.append({
            'history_id': row[0],
            'status': row[1],
            'changed_at': str(row[2]) if row[2] else None,
            'changed_by': row[3],
            'remarks': row[4]
        })
    return result

def get_completed_firs():
    rows = models.get_completed_firs()
    result = []
    for row in rows:
        result.append({
            'fir_id': row[0],
            'fir_number': row[1],
            'title': row[2],
            'description': row[3],
            'status': row[4],
            'date_filed': str(row[5]) if row[5] else None,
            'station_id': row[6],
            'station_name': row[7],
            'officer_id': row[8],
            'officer_badge': row[9],
            'citizen_id': row[10],
            'citizen_name': row[11],
            'category_id': row[12],
            'category_name': row[13]
        })
    return result

# Registration and password functions
def register_user(data):
    conn = get_connection()
    try:
        if not data['email'].endswith('@mail.com'):
            return {'error': 'Email must end with @mail.com'}
        existing = models.get_user_by_email(data['email'])
        if existing:
            return {'error': 'Email already registered'}
        role_id = models.get_role_id(data['role'])
        if not role_id:
            return {'error': 'Invalid role'}
        hashed = hash_password(data['password'])
        user_id = models.insert_user(data['email'], hashed, role_id, conn)
        if data['role'] == 'Citizen':
            citizen = data['citizen']
            models.insert_citizen(
                user_id, citizen['full_name'], citizen['phone'],
                citizen['address'], citizen['date_of_birth'], conn
            )
        elif data['role'] == 'Officer':
            officer = data['officer']
            models.insert_officer(
                user_id, officer['badge_number'], officer['rank'],
                officer['station_id'], officer['hire_date'], conn
            )
        else:
            conn.rollback()
            return {'error': 'Invalid role'}
        conn.commit()
        return {'message': 'User registered successfully', 'user_id': user_id}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'register_user failed: {e}\n')
        return {'error': 'Registration failed'}
    finally:
        release_connection(conn)

def change_password(user_id, old_password, new_password):
    conn = get_connection()
    try:
        q = 'SELECT password_hash FROM USERS WHERE user_id = %s'
        res = models._execute(q, (user_id,), fetch_one=True)
        if not res:
            return {'error': 'User not found'}
        from auth import ph
        try:
            ph.verify(res[0], old_password)
        except:
            return {'error': 'Current password is incorrect'}
        new_hash = hash_password(new_password)
        models.update_user_password(user_id, new_hash, conn)
        conn.commit()
        return {'message': 'Password changed successfully'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'change_password failed: {e}\n')
        return {'error': 'Password change failed'}
    finally:
        release_connection(conn)

def get_stations_list():
    rows = models.get_all_stations()
    return [{'station_id': r[0], 'station_name': r[1]} for r in rows]

def get_citizens():
    rows = models.get_all_citizens()
    return [{'citizen_id': r[0], 'full_name': r[1]} for r in rows]

def get_officer_rank(user_id):
    officer = models.get_officer_by_user_id(user_id)
    return officer[1] if officer else None

def get_pending_investigations(user_id):
    officer = models.get_officer_by_user_id(user_id)
    if not officer:
        return []
    officer_id = officer[0]
    rows = models.get_firs_by_officer_status(officer_id, 'Under Investigation')
    return [{'fir_id': r[0], 'fir_number': r[1], 'title': r[2], 'status': r[3], 'date_filed': str(r[4])} for r in rows]

def get_family_tree(criminal_id):
    rows = models.get_criminal_relations(criminal_id)
    tree = {'grandfather': None, 'father': None, 'son': None, 'grandson': None}
    warnings = []
    for cnic, full_name, rel_type in rows:
        if rel_type in tree:
            tree[rel_type] = {'cnic': cnic, 'full_name': full_name}
            if models.is_criminal_by_name(full_name):
                warnings.append({
                    'relation': rel_type,
                    'name': full_name,
                    'message': f'⚠️ {full_name} is also a known criminal!'
                })
    return {'tree': tree, 'warnings': warnings}

def get_arrested_criminals():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT c.criminal_id, c.full_name, c.alias, c.photo_url, 
                   fc.arrest_status, f.fir_number, f.title, f.status as fir_status,
                   s.station_name
            FROM CRIMINALS c
            JOIN FIR_CRIMINALS fc ON c.criminal_id = fc.criminal_id
            JOIN FIR f ON fc.fir_id = f.fir_id
            JOIN POLICE_STATIONS s ON f.station_id = s.station_id
            WHERE fc.arrest_status = 'Arrested' AND f.status = 'Completed'
            ORDER BY c.criminal_id
        """)
        rows = cur.fetchall()
        result = []
        for row in rows:
            result.append({
                'criminal_id': row[0],
                'full_name': row[1],
                'alias': row[2] if row[2] else '',
                'photo_url': row[3] if row[3] else None,
                'arrest_status': row[4],
                'fir_number': row[5],
                'fir_title': row[6],
                'fir_status': row[7],
                'station_name': row[8]
            })
        return result
    except Exception as e:
        print(f"Error in get_arrested_criminals: {e}")
        return []
    finally:
        release_connection(conn)

def get_criminal_full_details(criminal_id):
    row = models.get_criminal_by_id(criminal_id)
    if not row:
        return None
    return {
        'criminal_id': row[0],
        'full_name': row[1],
        'alias': row[2],
        'date_of_birth': str(row[3]) if row[3] else None,
        'gender': row[4],
        'address': row[5],
        'identifying_marks': row[6],
        'photo_url': row[7],
        'created_at': str(row[8]) if row[8] else None,
        'cnic': row[9]
    }

def get_criminal_relations(criminal_id):
    rows = models.get_criminal_relations_full(criminal_id)   # six columns: cnic, full_name, alias, dob, address, rel_type
    relations = {
        'grandfather': None,
        'father': None,
        'son': None,
        'grandson': None
    }
    for row in rows:
        cnic, full_name, alias, dob, address, rel_type = row
        if rel_type in relations:
            relations[rel_type] = {
                'cnic': cnic,
                'full_name': full_name,
                'alias': alias,
                'date_of_birth': dob,
                'address': address
            }
    return relations

def create_criminal(full_name, alias, date_of_birth, address, cnic, photo_url=None, relations=None):
    conn = get_connection()
    try:
        # Insert the criminal
        criminal_id = models.insert_criminal(full_name, alias, date_of_birth, address, cnic, photo_url, conn)
        
        # Insert family relations provided during creation
        if relations:
            for rel in relations:
                models.insert_criminal_relation_full(
                    criminal_id, rel.get('cnic'), rel.get('full_name'), rel.get('alias'),
                    rel.get('date_of_birth'), rel.get('address'), rel.get('relationship_type'), conn
                )
        
        # ---------- NEW BLOCK START ----------
        # If this criminal has a CNIC, check if they already appear as a relative
        # in any existing CRIMINAL_RELATIONSHIPS row (where they were not yet a criminal).
        # If found, update those rows to link to this criminal_id.
        if cnic:
            cur = conn.cursor()
            cur.execute(
                "UPDATE CRIMINAL_RELATIONSHIPS SET criminal_id = %s WHERE cnic = %s AND criminal_id IS DISTINCT FROM %s",
                (criminal_id, cnic, criminal_id)
            )
        # ---------- NEW BLOCK END ----------
        
        conn.commit()
        return {'message': 'Criminal created', 'criminal_id': criminal_id}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'create_criminal failed: {e}\n')
            import traceback
            traceback.print_exc(file=f)
        return {'error': f'Transaction rolled back: {str(e)}'}
    finally:
        release_connection(conn)

def update_criminal(criminal_id, full_name, alias, date_of_birth, address, cnic, photo_url=None, relations=None):
    conn = get_connection()
    try:
        models.update_criminal(criminal_id, full_name, alias, date_of_birth, address, cnic, photo_url, conn)
        models.delete_criminal_relations(criminal_id, conn)
        if relations:
            for rel in relations:
                models.insert_criminal_relation_full(
                    criminal_id, rel.get('cnic'), rel.get('full_name'), rel.get('alias'),
                    rel.get('date_of_birth'), rel.get('address'), rel.get('relationship_type'), conn
                )
        conn.commit()
        return {'message': 'Criminal updated', 'criminal_id': criminal_id}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'update_criminal failed: {e}\n')
            import traceback
            traceback.print_exc(file=f)
        return {'error': f'Update failed: {str(e)}'}
    finally:
        release_connection(conn)

def get_family_crime_history(criminal_id):
    try:
        criminal = models.get_criminal_by_id(criminal_id)
        if not criminal:
            return {'error': 'Criminal not found'}
        
        relations_rows = models.get_criminal_relations_full(criminal_id)
        crime_history = {}
        
        for row in relations_rows:
            cnic, full_name, alias, dob, address, rel_type = row
            person = {
                'cnic': cnic,
                'full_name': full_name,
                'alias': alias,
                'date_of_birth': dob,
                'address': address
            }
            
            # First try to find criminal by CNIC
            criminal_id_match = models.get_criminal_by_cnic(cnic) if cnic else None
            
            # If not found by CNIC, try by full name (case‑insensitive)
            if not criminal_id_match and full_name:
                conn = get_connection()
                try:
                    cur = conn.cursor()
                    cur.execute(
                        "SELECT criminal_id FROM CRIMINALS WHERE LOWER(full_name) = LOWER(%s) LIMIT 1",
                        (full_name,)
                    )
                    res = cur.fetchone()
                    if res:
                        criminal_id_match = res[0]
                except Exception as e:
                    print(f"Error searching criminal by name: {e}")
                finally:
                    release_connection(conn)
            
            crimes = []
            if criminal_id_match:
                crime_rows = models.get_crimes_by_criminal_id(criminal_id_match)
                crimes = [{
                    'fir_number': r[0],
                    'title': r[1],
                    'description': r[2],
                    'status': r[3],
                    'date_filed': str(r[4]),
                    'station_name': r[5],
                    'role': r[6],
                    'category': r[7]
                } for r in crime_rows]
            
            crime_history[rel_type] = {'person': person, 'crimes': crimes}
        
        return crime_history
    except Exception as e:
        print(f"Error in get_family_crime_history: {e}")
        return {'error': str(e)}
    
def update_fir_status(fir_id, status, officer_id, remarks):
    conn = get_connection()
    try:
        models.update_fir_status(fir_id, status, officer_id, conn)
        models.insert_status_history(fir_id, status, officer_id, remarks, conn)
        
        # Auto-arrest criminals when case is completed
        if status == 'Completed':
            cur = conn.cursor()
            cur.execute("""
                UPDATE FIR_CRIMINALS
                SET arrest_status = 'Arrested'
                WHERE fir_id = %s AND arrest_status != 'Arrested'
            """, (fir_id,))
            cur.close()
        
        models.insert_audit_log(officer_id, 'UPDATE', 'FIR', fir_id, conn)
        conn.commit()
        return {'message': 'Status updated'}
    except Exception as e:
        conn.rollback()
        with open('media/rollback_logs.txt', 'a') as f:
            f.write(f'update_fir_status failed: {e}\n')
        return {'error': 'Transaction rolled back'}
    finally:
        release_connection(conn)