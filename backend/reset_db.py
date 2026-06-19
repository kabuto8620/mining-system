"""
reset_db.py — Ejecuta esto UNA SOLA VEZ si quieres limpiar la base de datos
y dejarla con los datos iniciales correctos (sin duplicados).

Uso: python reset_db.py
"""
import sqlite3, os, sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "mining.db")

print(f"Base de datos: {DB_PATH}")

resp = input("¿Borrar y reiniciar la base de datos? Esto elimina todos los registros. (s/N): ")
if resp.lower() != 's':
    print("Cancelado.")
    sys.exit(0)

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print("Base de datos anterior eliminada.")

# init_db se ejecuta al importar server, que crea todo desde cero
import importlib.util, sys
spec = importlib.util.spec_from_file_location("server", os.path.join(BASE_DIR, "server.py"))
srv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(srv)
srv.init_db()
print("Base de datos reiniciada correctamente.")
print("Equipos creados:")
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
rows = conn.execute("SELECT area, COUNT(*) as c FROM equipment GROUP BY area").fetchall()
for r in rows:
    print(f"  {r['area']}: {r['c']} equipos")
total = conn.execute("SELECT COUNT(*) as c FROM equipment").fetchone()['c']
print(f"  TOTAL: {total} equipos")
conn.close()
print("\nCredenciales: admin / LadminZ")