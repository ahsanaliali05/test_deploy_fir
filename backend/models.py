from database import get_connection, release_connection

def _execute(query, params=None, conn=None, fetch_one=False, fetch_all=False, return_id=False):
    if conn:
        cur = conn.cursor()
        cur.execute(query, params)
        if return_id:
            return cur.fetchone()[0]
        if fetch_one:
            return cur.fetchone()
        if fetch_all:
            return cur.fetchall()
        return
    else:
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute(query, params)
            if return_id:
                res = cur.fetchone()[0]
                conn.commit()
                return res
            if fetch_one:
                res = cur.fetchone()
                conn.commit()
                return res
            if fetch_all:
                res = cur.fetchall()
                conn.commit()
                return res
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
            release_connection(conn)

# ---------- User ----------
def get_user_by_email(email):
    q = 'SELECT u.user_id, u.password_hash, r.role_name FROM USERS u JOIN ROLES r ON u.role_id = r.role_id WHERE u.email = %s'
    return _execute(q, (email,), fetch_one=True)

def get_citizen_id_by_user_id(user_id):
    q = 'SELECT citizen_id FROM CITIZENS WHERE user_id = %s'
    res = _execute(q, (user_id,), fetch_one=True)
    return res[0] if res else None

# ---------- FIR ----------
def insert_fir(fir_number, title, desc, citizen_id, officer_id, station_id, category_id, conn=None):
    q = '''INSERT INTO FIR (fir_number, title, description, citizen_id, officer_id, station_id, category_id)
           VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING fir_id'''
    return _execute(q, (fir_number, title, desc, citizen_id, officer_id, station_id, category_id), conn=conn, return_id=True)

def get_fir_by_id(fir_id):
    q = '''SELECT f.fir_number, f.title, f.description, f.status, f.date_filed,
                  f.citizen_id,
                  c.full_name AS citizen_name,
                  f.station_id,
                  s.station_name,
                  f.officer_id,
                  o.badge_number AS officer_badge,
                  f.category_id,
                  cat.category_name
           FROM FIR f
           LEFT JOIN CITIZENS c ON f.citizen_id = c.citizen_id
           LEFT JOIN POLICE_STATIONS s ON f.station_id = s.station_id
           LEFT JOIN OFFICERS o ON f.officer_id = o.officer_id
           LEFT JOIN CRIME_CATEGORIES cat ON f.category_id = cat.category_id
           WHERE f.fir_id = %s'''
    row = _execute(q, (fir_id,), fetch_one=True)
    if not row:
        return None
    return {
        'fir_number': row[0],
        'title': row[1],
        'description': row[2],
        'status': row[3],
        'date_filed': row[4],
        'citizen_id': row[5],
        'citizen_name': row[6],
        'station_id': row[7],
        'station_name': row[8],
        'officer_id': row[9],
        'officer_badge': row[10],
        'category_id': row[11],
        'category_name': row[12]
    }

def update_fir_status(fir_id, status, updated_by, conn=None):
    q = 'UPDATE FIR SET status = %s, updated_by = %s WHERE fir_id = %s'
    _execute(q, (status, updated_by, fir_id), conn=conn)

def insert_status_history(fir_id, status, changed_by, remarks, conn=None):
    q = 'INSERT INTO FIR_STATUS_HISTORY (fir_id, status, changed_by, remarks) VALUES (%s,%s,%s,%s)'
    _execute(q, (fir_id, status, changed_by, remarks), conn=conn)

def get_all_firs():
    q = '''SELECT f.fir_id, f.fir_number, f.title, f.status, f.date_filed,
                  f.station_id,
                  s.station_name,
                  c.city_id, c.city_name,
                  p.province_id, p.province_name
           FROM FIR f
           LEFT JOIN POLICE_STATIONS s ON f.station_id = s.station_id
           LEFT JOIN CITIES c ON s.city_id = c.city_id
           LEFT JOIN PROVINCES p ON c.province_id = p.province_id
           ORDER BY f.fir_id'''
    return _execute(q, fetch_all=True)

def get_firs_by_citizen(citizen_id):
    q = '''SELECT f.fir_id, f.fir_number, f.title, f.status, f.date_filed,
                  f.station_id,
                  s.station_name,
                  c.city_id, c.city_name,
                  p.province_id, p.province_name
           FROM FIR f
           LEFT JOIN POLICE_STATIONS s ON f.station_id = s.station_id
           LEFT JOIN CITIES c ON s.city_id = c.city_id
           LEFT JOIN PROVINCES p ON c.province_id = p.province_id
           WHERE f.citizen_id = %s
           ORDER BY f.fir_id'''
    return _execute(q, (citizen_id,), fetch_all=True)

def get_status_history(fir_id):
    q = 'SELECT history_id, status, changed_at, changed_by, remarks FROM FIR_STATUS_HISTORY WHERE fir_id = %s ORDER BY changed_at DESC'
    return _execute(q, (fir_id,), fetch_all=True)

def get_completed_firs():
    q = '''SELECT f.fir_id, f.fir_number, f.title, f.description, f.status, f.date_filed,
                  f.station_id, s.station_name,
                  f.officer_id, o.badge_number,
                  f.citizen_id, c.full_name as citizen_name,
                  f.category_id, cat.category_name
           FROM FIR f
           LEFT JOIN POLICE_STATIONS s ON f.station_id = s.station_id
           LEFT JOIN OFFICERS o ON f.officer_id = o.officer_id
           LEFT JOIN CITIZENS c ON f.citizen_id = c.citizen_id
           LEFT JOIN CRIME_CATEGORIES cat ON f.category_id = cat.category_id
           WHERE f.status = 'Completed'
           ORDER BY f.date_filed DESC'''
    return _execute(q, fetch_all=True)

def get_criminals_by_fir(fir_id):
    q = '''SELECT c.criminal_id, c.full_name, c.alias, c.photo_url, fc.role
           FROM FIR_CRIMINALS fc
           JOIN CRIMINALS c ON fc.criminal_id = c.criminal_id
           WHERE fc.fir_id = %s'''
    return _execute(q, (fir_id,), fetch_all=True)

# ---------- Criminals ----------
def get_all_criminals():
    q = '''SELECT criminal_id, full_name, alias, address, photo_url, cnic
           FROM CRIMINALS ORDER BY criminal_id'''
    return _execute(q, fetch_all=True)

def add_criminal_to_fir(fir_id, criminal_id, role, conn=None):
    q = 'INSERT INTO FIR_CRIMINALS (fir_id, criminal_id, role) VALUES (%s,%s,%s)'
    _execute(q, (fir_id, criminal_id, role), conn=conn)

def insert_criminal_relation(cnic, full_name, alias, dob, address, criminal_id, rel_type, conn=None):
    q = '''INSERT INTO CRIMINAL_RELATIONSHIPS
           (cnic, full_name, alias, date_of_birth, address, criminal_id, relationship_type)
           VALUES (%s,%s,%s,%s,%s,%s,%s)'''
    _execute(q, (cnic, full_name, alias, dob, address, criminal_id, rel_type), conn=conn)

def get_criminal_relations(criminal_id):
    q = 'SELECT cnic, full_name, relationship_type FROM CRIMINAL_RELATIONSHIPS WHERE criminal_id = %s'
    return _execute(q, (criminal_id,), fetch_all=True)

def insert_criminal(full_name, alias, date_of_birth, address, cnic, photo_url, conn=None):
    q = '''INSERT INTO CRIMINALS (full_name, alias, date_of_birth, address, cnic, photo_url)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING criminal_id'''
    return _execute(q, (full_name, alias, date_of_birth, address, cnic, photo_url), conn=conn, return_id=True)

def update_criminal(criminal_id, full_name, alias, date_of_birth, address, cnic, photo_url, conn=None):
    q = '''UPDATE CRIMINALS 
           SET full_name = %s, alias = %s, date_of_birth = %s, address = %s, cnic = %s, photo_url = %s
           WHERE criminal_id = %s'''
    _execute(q, (full_name, alias, date_of_birth, address, cnic, photo_url, criminal_id), conn=conn)

def get_criminal_by_id(criminal_id):
    q = '''SELECT criminal_id, full_name, alias, date_of_birth, gender, address, 
                  identifying_marks, photo_url, created_at, cnic
           FROM CRIMINALS WHERE criminal_id = %s'''
    return _execute(q, (criminal_id,), fetch_one=True)

def get_criminal_by_cnic(cnic):
    q = 'SELECT criminal_id FROM CRIMINALS WHERE cnic = %s LIMIT 1'
    res = _execute(q, (cnic,), fetch_one=True)
    return res[0] if res else None

def delete_criminal_relations(criminal_id, conn=None):
    q = 'DELETE FROM CRIMINAL_RELATIONSHIPS WHERE criminal_id = %s'
    _execute(q, (criminal_id,), conn=conn)

def insert_criminal_relation_full(criminal_id, cnic, full_name, alias, date_of_birth, address, relationship_type, conn=None):
    q = '''INSERT INTO CRIMINAL_RELATIONSHIPS
           (criminal_id, cnic, full_name, alias, date_of_birth, address, relationship_type)
           VALUES (%s, %s, %s, %s, %s, %s, %s)'''
    _execute(q, (criminal_id, cnic, full_name, alias, date_of_birth, address, relationship_type), conn=conn)

def get_criminal_relations_full(criminal_id):
    q = '''SELECT cnic, full_name, alias, date_of_birth, address, relationship_type
           FROM CRIMINAL_RELATIONSHIPS WHERE criminal_id = %s'''
    return _execute(q, (criminal_id,), fetch_all=True)

def get_crimes_by_criminal_id(criminal_id):
    q = '''SELECT f.fir_number, f.title, f.description, f.status, f.date_filed,
                  s.station_name, fc.role, cat.category_name
           FROM FIR_CRIMINALS fc
           JOIN FIR f ON fc.fir_id = f.fir_id
           JOIN POLICE_STATIONS s ON f.station_id = s.station_id
           JOIN CRIME_CATEGORIES cat ON f.category_id = cat.category_id
           WHERE fc.criminal_id = %s
           ORDER BY f.date_filed DESC'''
    return _execute(q, (criminal_id,), fetch_all=True)

# ---------- Witnesses ----------
def add_witness(fir_id, full_name, contact_info, statement, conn=None):
    q = 'INSERT INTO WITNESSES (fir_id, full_name, contact_info, statement) VALUES (%s,%s,%s,%s)'
    _execute(q, (fir_id, full_name, contact_info, statement), conn=conn)

def get_witnesses_by_fir(fir_id):
    q = 'SELECT witness_id, full_name, statement FROM WITNESSES WHERE fir_id = %s'
    return _execute(q, (fir_id,), fetch_all=True)

# ---------- Evidence ----------
def add_evidence(fir_id, description, file_path, uploaded_by, conn=None):
    q = 'INSERT INTO EVIDENCE (fir_id, description, file_path, uploaded_by) VALUES (%s,%s,%s,%s)'
    _execute(q, (fir_id, description, file_path, uploaded_by), conn=conn)

def get_evidence_by_fir(fir_id):
    q = 'SELECT evidence_id, description, file_path FROM EVIDENCE WHERE fir_id = %s'
    return _execute(q, (fir_id,), fetch_all=True)

# ---------- Audit ----------
def insert_audit_log(user_id, action, table_name, record_id, conn=None):
    q = 'INSERT INTO AUDIT_LOGS (user_id, action_performed, table_name, record_id) VALUES (%s,%s,%s,%s)'
    _execute(q, (user_id, action, table_name, record_id), conn=conn)

# ---------- Location Data ----------
def get_all_provinces():
    q = 'SELECT province_id, province_name FROM PROVINCES ORDER BY province_id'
    return _execute(q, fetch_all=True)

def get_cities_by_province(province_id):
    q = 'SELECT city_id, city_name FROM CITIES WHERE province_id = %s ORDER BY city_id'
    return _execute(q, (province_id,), fetch_all=True)

def get_stations_by_city(city_id):
    q = 'SELECT station_id, station_name FROM POLICE_STATIONS WHERE city_id = %s ORDER BY station_id'
    return _execute(q, (city_id,), fetch_all=True)

# ---------- Delete ----------
def delete_fir(fir_id, conn=None):
    q = 'DELETE FROM FIR WHERE fir_id = %s'
    _execute(q, (fir_id,), conn=conn)

def delete_criminal(criminal_id, conn=None):
    q = 'DELETE FROM CRIMINALS WHERE criminal_id = %s'
    _execute(q, (criminal_id,), conn=conn)

# ---------- User Management (registration, etc.) ----------
def insert_user(email, password_hash, role_id, conn=None):
    q = 'INSERT INTO USERS (email, password_hash, role_id) VALUES (%s, %s, %s) RETURNING user_id'
    return _execute(q, (email, password_hash, role_id), conn=conn, return_id=True)

def insert_citizen(user_id, full_name, phone, address, date_of_birth, conn=None):
    q = '''INSERT INTO CITIZENS (user_id, full_name, phone, address, date_of_birth)
           VALUES (%s, %s, %s, %s, %s) RETURNING citizen_id'''
    return _execute(q, (user_id, full_name, phone, address, date_of_birth), conn=conn, return_id=True)

def get_all_stations():
    q = 'SELECT station_id, station_name FROM POLICE_STATIONS ORDER BY station_id'
    return _execute(q, fetch_all=True)

def insert_officer(user_id, badge_number, rank, station_id, hire_date, conn=None):
    q = '''INSERT INTO OFFICERS (user_id, badge_number, rank, station_id, hire_date)
           VALUES (%s, %s, %s, %s, %s) RETURNING officer_id'''
    return _execute(q, (user_id, badge_number, rank, station_id, hire_date), conn=conn, return_id=True)

def update_user_password(user_id, new_password_hash, conn=None):
    q = 'UPDATE USERS SET password_hash = %s WHERE user_id = %s'
    _execute(q, (new_password_hash, user_id), conn=conn)

def get_role_id(role_name):
    q = 'SELECT role_id FROM ROLES WHERE role_name = %s'
    res = _execute(q, (role_name,), fetch_one=True)
    return res[0] if res else None

def get_all_citizens():
    q = 'SELECT citizen_id, full_name FROM CITIZENS ORDER BY full_name'
    return _execute(q, fetch_all=True)

def get_officer_by_user_id(user_id):
    q = 'SELECT officer_id, rank FROM OFFICERS WHERE user_id = %s'
    return _execute(q, (user_id,), fetch_one=True)

def get_firs_by_officer_status(officer_id, status):
    q = 'SELECT fir_id, fir_number, title, status, date_filed FROM FIR WHERE officer_id = %s AND status = %s ORDER BY date_filed DESC'
    return _execute(q, (officer_id, status), fetch_all=True)
