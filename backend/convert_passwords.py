import psycopg2
from argon2 import PasswordHasher
from config import Config

ph = PasswordHasher()

def convert_passwords():
    conn = psycopg2.connect(Config.DATABASE_URL)
    cur = conn.cursor()
    
    # Select users where password_hash is NOT already an Argon2 hash
    cur.execute("SELECT user_id, password_hash FROM USERS WHERE password_hash NOT LIKE '$argon2%'")
    users = cur.fetchall()
    
    if not users:
        print("No plain-text passwords found. Already converted.")
        return
    
    for user_id, plain_password in users:
        hashed = ph.hash(plain_password)
        cur.execute("UPDATE USERS SET password_hash = %s WHERE user_id = %s", (hashed, user_id))
        print(f"Updated user {user_id}")
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Converted {len(users)} user(s).")

if __name__ == "__main__":
    convert_passwords()
