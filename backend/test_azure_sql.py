import os
from urllib.parse import parse_qs, unquote, urlparse

import pyodbc
from dotenv import load_dotenv

load_dotenv()


def sqlalchemy_url_to_pyodbc(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "mssql+pyodbc":
        raise ValueError("Not a mssql+pyodbc URL")

    query = parse_qs(parsed.query)
    driver = unquote(query.get("driver", ["SQL Server"])[0]).replace("+", " ")
    server = parsed.hostname or ""
    database = parsed.path.lstrip("/")
    username = unquote(parsed.username or "")
    password = unquote(parsed.password or "")

    if not server or not database or not username:
        raise ValueError("DATABASE_URL is missing server, database, or username")

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
        f"UID={username}",
        f"PWD={password}",
        "Encrypt=yes",
        "TrustServerCertificate=no",
        "Connection Timeout=30",
    ]
    if parsed.port:
        parts[1] = f"SERVER={server},{parsed.port}"
    return ";".join(parts) + ";"


if __name__ == "__main__":
    conn_str = os.getenv("DATABASE_URL", "")
    if not conn_str.startswith("mssql+pyodbc://"):
        print("Not a mssql URL")
        raise SystemExit(0)

    pyodbc_str = sqlalchemy_url_to_pyodbc(conn_str)
    print(f"Testing with driver(s): {pyodbc.drivers()}")

    try:
        conn = pyodbc.connect(pyodbc_str)
        print("Connection Successful")
        cursor = conn.cursor()
        cursor.execute("SELECT @@version")
        row = cursor.fetchone()
        print(f"Server version: {row[0]}")
        conn.close()
    except Exception as exc:
        print(f"Connection Failed: {exc}")
        raise
