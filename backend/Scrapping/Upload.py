"""
Upload.py  —  PostgreSQL version
Uploads a city JSON file into the 'cars' table.
"""

import json
import uuid
import psycopg2
from psycopg2.extras import Json
DATABASE_URL = "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a/carapp_b1m1"
DATABASE_URL1 = "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a.oregon-postgres.render.com/carapp_b1m1"
# ── Choose which city file to upload ──────────────────────────────────────
city1  = "Ahmedabad"
city2  = "All"
city3  = "Bangalore"
city4  = "Chandigarh"
city5  = "Chennai"
city6  = "Delhi"
city7  = "Gurgaon"
city8  = "Hyderabad"
city9  = "Jaipur"
city10 = "Kolkata"
city11 = "Lucknow"
city12 = "Mumbai"
city13 = "Noida"
city14 = "Pune"

CITY = city2   # ← change to upload a different city

# ── Load JSON ─────────────────────────────────────────────────────────────
with open(f"{CITY}.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# ── Insert into PostgreSQL ─────────────────────────────────────────────────
conn = psycopg2.connect(DATABASE_URL1)
cur  = conn.cursor()

for item in data:
    doc_id = str(uuid.uuid4())

    cur.execute("""
        INSERT INTO cars (id, make, model, price, fuel, fuel_type, transmission, city, data)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO NOTHING;
    """, (
        doc_id,
        item.get("make"),
        item.get("model"),
        item.get("price"),
        item.get("fuel"),
        item.get("fuelType"),
        item.get("transmission"),
        item.get("city"),
        Json(item),          # full original object stored as JSONB for any extra fields
    ))

conn.commit()
cur.close()
conn.close()

print("Upload Complete")