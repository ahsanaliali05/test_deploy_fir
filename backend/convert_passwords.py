import psycopg2
from argon2 import PasswordHasher
from config import Config

ph = PasswordHasher()

def convert_passwords():
    # Connect directly (or reuse your database.py connection)
    conn = psycopg2.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASS
    )
    cur = conn.cursor()

    # Select all users
    cur.execute("SELECT user_id, password_hash FROM USERS")
    users = cur.fetchall()

    for user_id, plain_password in users:
        # Hash the plaintext password
        hashed = ph.hash(plain_password)
        # Update the record
        cur.execute("UPDATE USERS SET password_hash = %s WHERE user_id = %s", (hashed, user_id))
        print(f"Updated user {user_id}")

    conn.commit()
    cur.close()
    conn.close()
    print("All passwords converted.")

if __name__ == "__main__":
    convert_passwords()