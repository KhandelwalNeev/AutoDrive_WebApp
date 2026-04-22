"""
db_init.py
Run once to create all PostgreSQL tables.
Usage: python db_init.py
"""

import psycopg2
DATABASE_URL = "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a/carapp_b1m1"
#DATABASE_URLS = "postgresql://postgres:0000@localhost:5432/carapp"

def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    # ── Users ──────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id   TEXT PRIMARY KEY,
            firstname TEXT,
            lastname  TEXT,
            email     TEXT UNIQUE NOT NULL,
            phone     TEXT,
            password  TEXT
        );
    """)

    # ── Cars ───────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cars (
            id           TEXT PRIMARY KEY,
            make         TEXT,
            model        TEXT,
            price        NUMERIC,
            fuel         TEXT,
            fuel_type    TEXT,
            transmission TEXT,
            city         TEXT,
            data         JSONB        -- stores any extra fields from original JSON
        );
    """)

    # ── News ───────────────────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS news_articles (
            article_id   TEXT PRIMARY KEY,   -- md5 of url
            region       TEXT NOT NULL,      -- 'india' | 'global'
            date         DATE NOT NULL,
            title        TEXT,
            description  TEXT,
            content      TEXT,
            url          TEXT,
            image        TEXT,
            source       TEXT,
            published_at TEXT,
            saved_at     TEXT
        );
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_news_region_date ON news_articles (region, date);")

    conn.commit()
    cur.close()
    conn.close()
    print("✅ All tables created (or already exist).")


if __name__ == "__main__":
    init_db()