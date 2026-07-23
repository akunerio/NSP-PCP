import os
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

load_dotenv()

DB_CONFIG = {
    'host': os.getenv("DB_HOST", "localhost"),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD", ""),
    'db': os.getenv("DB_NAME", "nsp-pcp-db"),
    'charset': os.getenv("DB_CHARSET", "utf8mb4"),
    'cursorclass': DictCursor
}
