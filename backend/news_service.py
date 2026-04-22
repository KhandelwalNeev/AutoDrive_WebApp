"""
news_service.py  —  PostgreSQL version
Fetches automotive news from GNews and stores it in PostgreSQL.
Concept is identical to the Firebase version; only storage is changed.
"""

import requests
import hashlib
import psycopg2
from datetime import datetime, timezone
DATABASE_URL = "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a/carapp_b1m1"
#DATABASE_URLS = "postgresql://postgres:0000@localhost:5432/carapp"

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
GNEWS_API_KEY = "25511d38f005ccc3c130d61ad2fbb228"
GNEWS_BASE    = "https://gnews.io/api/v4/search"

INDIA_QUERIES = [
    "car launch India 2026",
    "bike launch India 2026",
    "electric vehicle India",
    "new car India price",
    "SUV launch India",
    "Maruti Suzuki new model",
    "Tata Motors new car",
    "Hyundai India launch",
    "EV charging India",
    "used car India market",
]

GLOBAL_QUERIES = [
    "new car launch 2026",
    "electric vehicle launch",
    "EV market 2026",
    "Tesla new model",
    "car industry news",
    "hybrid car launch",
    "autonomous vehicle news",
    "auto show 2026",
    "car technology news",
    "used car market global",
]


# ─────────────────────────────────────────────
# DB HELPERS
# ─────────────────────────────────────────────
def get_conn():
    """Return a new psycopg2 connection."""
    return psycopg2.connect(DATABASE_URL)


# ─────────────────────────────────────────────
# FETCH FROM GNEWS
# ─────────────────────────────────────────────
def fetch_gnews_single(query: str, max_results: int = 10) -> list:
    try:
        url = (
            f"{GNEWS_BASE}"
            f"?q={requests.utils.quote(query)}"
            f"&lang=en"
            f"&max={max_results}"
            f"&sortby=publishedAt"
            f"&apikey={GNEWS_API_KEY}"
        )
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if "errors" in data:
            print(f"    ⚠️  GNews error for '{query}': {data['errors']}")
            return []

        return data.get("articles", [])

    except Exception as e:
        print(f"    ⚠️  Failed to fetch '{query}': {e}")
        return []


def fetch_all_for_region(queries: list) -> list:
    """Fetch all queries, deduplicate by URL."""
    seen_urls    = set()
    all_articles = []

    for query in queries:
        articles = fetch_gnews_single(query)
        for article in articles:
            url = article.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_articles.append(article)

    return all_articles


# ─────────────────────────────────────────────
# SAVE TO POSTGRESQL
# ─────────────────────────────────────────────
def url_to_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def save_articles(region: str, articles: list) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    saved = 0

    conn = get_conn()
    cur  = conn.cursor()

    for article in articles:
        article_id = url_to_id(article.get("url", ""))

        # Idempotent — skip if already exists
        cur.execute(
            "SELECT 1 FROM news_articles WHERE article_id = %s;",
            (article_id,)
        )
        if cur.fetchone():
            continue

        cur.execute("""
            INSERT INTO news_articles
                (article_id, region, date, title, description, content,
                 url, image, source, published_at, saved_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            article_id,
            region,
            today,
            article.get("title",       ""),
            article.get("description", ""),
            article.get("content",     ""),
            article.get("url",         ""),
            article.get("image",       ""),
            article.get("source", {}).get("name", ""),
            article.get("publishedAt", ""),
            datetime.now(timezone.utc).isoformat(),
        ))
        saved += 1

    conn.commit()
    cur.close()
    conn.close()
    return saved


# ─────────────────────────────────────────────
# CHECK IF TODAY ALREADY FETCHED
# ─────────────────────────────────────────────
def today_already_fetched(region: str) -> bool:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    conn  = get_conn()
    cur   = conn.cursor()
    cur.execute(
        "SELECT 1 FROM news_articles WHERE region = %s AND date = %s LIMIT 1;",
        (region, today)
    )
    exists = cur.fetchone() is not None
    cur.close()
    conn.close()
    return exists


# ─────────────────────────────────────────────
# MAIN RUNNER
# ─────────────────────────────────────────────
def run_news_fetch(force: bool = False):
    """
    force=False → skips if today's data already in DB (used on startup)
    force=True  → always re-fetches (used by scheduler + manual trigger)
    """
    results = {}

    for region, queries in [("india", INDIA_QUERIES), ("global", GLOBAL_QUERIES)]:
        print(f"\n[{datetime.now().isoformat()}] ── {region.upper()} ──")

        if not force and today_already_fetched(region):
            print(f"  ℹ️  Today's {region} news already saved. Skipping.")
            results[region] = {"fetched": 0, "saved": 0, "skipped": True}
            continue

        articles = fetch_all_for_region(queries)
        print(f"  📥 Fetched {len(articles)} unique articles")

        saved = save_articles(region, articles)
        print(f"  ✅ Saved {saved} new articles to PostgreSQL")

        results[region] = {"fetched": len(articles), "saved": saved, "skipped": False}

    return results


# ─────────────────────────────────────────────
# STARTUP FETCH
# ─────────────────────────────────────────────
def fetch_on_startup():
    """Only fetches if today's news not already in DB."""
    print("\n🚀 Startup news check...")
    try:
        result = run_news_fetch(force=False)
        print(f"   Startup result: {result}\n")
    except Exception as e:
        print(f"   ⚠️ Startup fetch failed: {e}\n")


if __name__ == "__main__":
    result = run_news_fetch(force=True)
    print("\n✅ Done:", result)