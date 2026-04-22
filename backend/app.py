"""
app.py  —  PostgreSQL version
Prediction results are logged to the `price_predictions` table in PostgreSQL.
"""

from flask import Flask, request, jsonify
import psycopg2
import psycopg2.extras
import uuid
from flask_cors import CORS
from datetime import datetime, timezone
from news_service import run_news_fetch, fetch_on_startup
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
import joblib
import os
from db_init import init_db
init_db()
DATABASE_URL = "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a/carapp_b1m1"

app = Flask(__name__)
CORS(app)

_model = None
_cars_df = None

def load_resources():
    global _model, _cars_df

    if _model is None or _cars_df is None:
        try:
            BASE_DIR = os.path.dirname(os.path.abspath(__file__))

            print("🔄 Loading model and dataframe...")
            _model = joblib.load(os.path.join(BASE_DIR, "car_model.pkl"))
            _cars_df = joblib.load(os.path.join(BASE_DIR, "cars_dataframe.pkl"))

            print("✅ Model loaded successfully")

        except Exception as e:
            print(f"❌ Error loading model: {e}")

def get_conn():
    """Return a new psycopg2 connection with RealDictCursor for dict-like rows."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def ensure_predictions_table():
    """
    Creates the price_predictions table if it does not already exist.
    Safe to call on every startup — uses CREATE TABLE IF NOT EXISTS.
    """
    ddl = """
        CREATE TABLE IF NOT EXISTS price_predictions (
            id               SERIAL PRIMARY KEY,
            region           TEXT,
            manufacturer     TEXT,
            model            TEXT,
            fuel             TEXT,
            engine_cc        NUMERIC,
            max_power        NUMERIC,
            cylinders        INTEGER,
            transmission     TEXT,
            body_type        TEXT,
            drive_train      TEXT,
            seats            INTEGER,
            km_driven        INTEGER,
            age              INTEGER,
            predicted_price  BIGINT,
            price_low        BIGINT,
            price_high       BIGINT,
            confidence       INTEGER,
            predicted_at     TIMESTAMPTZ DEFAULT NOW()
        );
    """
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(ddl)
        conn.commit()
        cur.close()
        conn.close()
        print("✅ price_predictions table ready")
    except Exception as e:
        print(f"⚠️ Could not create price_predictions table: {e}")


# ─────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────

@app.route("/create_user", methods=["POST"])
def create_user():
    try:
        data    = request.get_json()
        user_id = str(uuid.uuid4())

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO users (user_id, firstname, lastname, email, phone, password)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (
            user_id,
            data.get("firstname"),
            data.get("lastname"),
            data.get("email"),
            data.get("phone"),
            data.get("password"),
        ))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "user_id": user_id})
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/login", methods=["POST"])
def login():
    try:
        data     = request.get_json()
        email    = data.get("email")
        password = data.get("password")

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE email = %s AND password = %s LIMIT 1;",
            (email, password)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            return jsonify({
                "success": True,
                "user_id": user["user_id"],
                "name":    (user.get("firstname") or "") + " " + (user.get("lastname") or ""),
                "email":   user["email"],
                "phone":   user.get("phone", ""),
            })
        return jsonify({"success": False, "message": "Invalid email or password"})
    except Exception as e:
        return jsonify({"error": str(e)})


# ─────────────────────────────────────────────
# CARS
# ─────────────────────────────────────────────

@app.route("/filter_cars", methods=["GET"])
def filter_cars():
    try:
        make          = request.args.get("make")
        price         = request.args.get("price", type=int)
        fuels         = request.args.getlist("fuel")
        transmissions = request.args.getlist("transmission")
        city          = request.args.get("city")

        sql    = "SELECT * FROM cars WHERE 1=1"
        params = []

        if make:
            sql += " AND make = %s"
            params.append(make)

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = []
        for row in rows:
            car = dict(row)
            if price and (car.get("price") or 0) > price:
                continue
            if fuels and car.get("fuel") not in fuels and car.get("fuel_type") not in fuels:
                continue
            if transmissions and car.get("transmission") not in transmissions:
                continue
            if city and car.get("city") != city:
                continue
            merged = {**(car.get("data") or {}), **{k: v for k, v in car.items() if k != "data"}}
            result.append(merged)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/all_cars", methods=["GET"])
def all_cars():
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("SELECT * FROM cars;")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = []
        for row in rows:
            car    = dict(row)
            merged = {**(car.get("data") or {}), **{k: v for k, v in car.items() if k != "data"}}
            result.append(merged)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# NEWS
# ─────────────────────────────────────────────

@app.route("/fetch_news", methods=["POST"])
def fetch_news():
    try:
        result = run_news_fetch(force=True)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/news", methods=["GET"])
def get_news():
    try:
        region = request.args.get("region", "india").lower()
        date   = request.args.get("date", "")
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("""
            SELECT * FROM news_articles
            WHERE region = %s AND date = %s
            ORDER BY published_at DESC;
        """, (region, date))
        rows     = cur.fetchall()
        articles = [dict(row) for row in rows]
        cur.close()
        conn.close()

        return jsonify({
            "success":  True,
            "region":   region,
            "date":     date,
            "count":    len(articles),
            "articles": articles,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/news/dates", methods=["GET"])
def get_news_dates():
    try:
        region = request.args.get("region", "india").lower()

        conn = get_conn()
        cur  = conn.cursor()
        cur.execute("""
            SELECT DISTINCT date::text
            FROM news_articles
            WHERE region = %s
            ORDER BY date DESC;
        """, (region,))
        dates = [row["date"] for row in cur.fetchall()]
        cur.close()
        conn.close()

        return jsonify({"success": True, "region": region, "dates": dates})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
# PRICE PREDICTION
# ─────────────────────────────────────────────

@app.route("/predict/options", methods=["GET"])
def predict_options():
    load_resources()  # 👈 IMPORTANT

    if _cars_df is None:
        return jsonify({"success": False, "error": "Model data not loaded"}), 500

    df = _cars_df

    return jsonify({
        "success": True,
        "regions": sorted(df["region"].dropna().unique().tolist()),
        "manufacturers": sorted(df["manufacturer"].dropna().unique().tolist()),
    })

@app.route("/predict/models", methods=["GET"])
def predict_models():
    if _cars_df is None:
        return jsonify({"success": False, "error": "Model data not loaded"}), 500

    manufacturer = request.args.get("manufacturer", "")
    model_name   = request.args.get("model", "")

    df = _cars_df
    if manufacturer:
        df = df[df["manufacturer"] == manufacturer]

    models = sorted(df["model"].dropna().unique().tolist())

    options = {}
    if model_name and manufacturer:
        mdf = df[df["model"] == model_name]

        def uniq(col):
            return sorted(mdf[col].dropna().unique().tolist()) if col in mdf.columns else []

        options = {
            "fuels":         uniq("fuel"),
            "engine_ccs":    uniq("engine_cc"),
            "cylinders":     uniq("cylinders"),
            "max_powers":    uniq("max_power"),
            "transmissions": uniq("transmission"),
            "body_types":    uniq("type"),
            "drivetrains":   uniq("drive"),
            "seats":         uniq("seats"),
        }

    return jsonify({"success": True, "models": models, "options": options})


@app.route("/predict_price", methods=["POST"])
def predict_price():
    load_resources()  # 👈 IMPORTANT

    if _model is None or _cars_df is None:
        return jsonify({"success": False, "error": "Prediction model not loaded"}), 500

    try:
        data = request.get_json()

        check = _cars_df.copy()
        for col, key in [("manufacturer", "manufacturer"),
                         ("model", "model"),
                         ("fuel", "fuel"),
                         ("transmission", "transmission")]:
            val = data.get(key)
            if val:
                check = check[check[col] == val]

        if check.empty:
            return jsonify({
                "success": False,
                "error": "Invalid combination"
            }), 400

        fuel = data.get("fuel", "")

        input_dict = {
            "region": data.get("region"),
            "manufacturer": data.get("manufacturer"),
            "model": data.get("model"),
            "fuel": fuel,
            "engine_cc": 0 if fuel == "electric" else data.get("engine_cc"),
            "max_power": data.get("max_power"),
            "cylinders": 0 if fuel == "electric" else data.get("cylinders"),
            "transmission": data.get("transmission"),
            "type": data.get("body_type"),
            "drive": data.get("drive_train"),
            "seats": data.get("seats"),
            "odometer": data.get("km_driven"),
            "age": data.get("age"),
        }

        input_df = pd.DataFrame([input_dict])
        prediction = float(_model.predict(input_df)[0])

        mae = 94338
        lower = prediction - 0.75 * mae
        upper = prediction + 0.75 * mae

        result_payload = {
            "price": round(prediction),
            "low": round(lower),
            "high": round(upper),
            "confidence": 75,
        }

        return jsonify({"success": True, "result": result_payload})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/predictions/history", methods=["GET"])
def predictions_history():
    """
    GET /predictions/history?limit=50
    Returns the most recent predictions logged to PostgreSQL.
    """
    try:
        limit = request.args.get("limit", 50, type=int)
        conn  = get_conn()
        cur   = conn.cursor()
        cur.execute("""
            SELECT * FROM price_predictions
            ORDER BY predicted_at DESC
            LIMIT %s;
        """, (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"success": True, "count": len(rows), "predictions": rows})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        func=lambda: run_news_fetch(force=True),
        trigger="cron",
        hour=7,
        minute=0,
        id="daily_news_fetch",
        replace_existing=True,
    )
    scheduler.start()
    print("✅ News scheduler started — runs daily at 07:00 UTC (12:30 PM IST)")


ensure_predictions_table()   # auto-creates table on first run
if os.environ.get("RENDER") != "true":
    fetch_on_startup()
    start_scheduler()

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)