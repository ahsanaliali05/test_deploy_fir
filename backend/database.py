import psycopg2
from psycopg2 import pool
from config import Config

connection_pool = None

def init_pool():
    global connection_pool
    if connection_pool is None:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 10,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASS
        )

def get_connection():
    global connection_pool
    if connection_pool is None:
        init_pool()
    return connection_pool.getconn()

def release_connection(conn):
    global connection_pool
    if connection_pool:
        connection_pool.putconn(conn)

def close_pool():
    global connection_pool
    if connection_pool:
        connection_pool.closeall()