"""
config.py
Reads DATABASE_URL from environment (or .env file via python-dotenv).

Set your PostgreSQL connection string as:
  DATABASE_URL=postgresql://user:password@localhost:5432/yourdbname

You can also create a .env file in the project root with that line.
"""

import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv is optional; set env var manually if not installed

DATABASE_URL = os.environ.get(
    DATABASE_URL,
    "postgresql://carapp_user:q5pisiphLf8wgKsVPbsmjZYmEfD2r0ju@dpg-d7gjjb8sfn5c73bsbfag-a/carapp_b1m1"   # ← change this default
)