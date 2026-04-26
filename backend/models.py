"""
SQLite database models for Sentinel-Ops.
Tables: users, analyses
"""
import os
import sqlite3
import json
import uuid
from datetime import datetime

import bcrypt

DB_PATH = os.path.join(os.path.dirname(__file__), "sentinel.db")


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'analyst', 'responder')),
            avatar_color TEXT DEFAULT 'hsl(152 76% 46%)',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            upload_id TEXT NOT NULL,
            filename TEXT,
            pre_image_path TEXT,
            post_image_path TEXT,
            input_path TEXT,
            output_path TEXT,
            mask_path TEXT,
            heatmap_path TEXT,
            status TEXT DEFAULT 'completed' CHECK(status IN ('queued','processing','completed','failed')),
            severity_score INTEGER DEFAULT 0,
            damage_percentage REAL DEFAULT 0,
            risk_level TEXT DEFAULT 'low',
            affected_regions INTEGER DEFAULT 0,
            buildings_damaged INTEGER DEFAULT 0,
            estimated_population INTEGER DEFAULT 0,
            class_distribution TEXT DEFAULT '[]',
            regions TEXT DEFAULT '[]',
            model_version TEXT DEFAULT 'unet-disaster-v2.0',
            inference_ms INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)

    # Migrate old DB: add new columns if they don't exist
    try:
        conn.execute("ALTER TABLE analyses ADD COLUMN pre_image_path TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass  # column already exists
    try:
        conn.execute("ALTER TABLE analyses ADD COLUMN post_image_path TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE analyses ADD COLUMN heatmap_path TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()
    print("[db] Database initialized")


# ── User helpers ────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_user(name: str, email: str, password: str, role: str, avatar_color: str = None) -> dict:
    uid = "u_" + uuid.uuid4().hex[:8]
    pw_hash = hash_password(password)
    color = avatar_color or f"hsl({hash(email) % 360} 70% 50%)"
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (id, name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)",
            (uid, name, email, pw_hash, role, color),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return None  # email already exists
    conn.close()
    return {"id": uid, "name": name, "email": email, "role": role, "avatarColor": color}


def get_user_by_email(email: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_user_by_id(uid: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def list_users() -> list:
    conn = get_db()
    rows = conn.execute("SELECT id, name, email, role, avatar_color, created_at FROM users ORDER BY created_at").fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "email": r["email"], "role": r["role"], "avatarColor": r["avatar_color"]} for r in rows]


# ── Analysis helpers ────────────────────────────────────────────────────────

def save_analysis(data: dict) -> str:
    aid = "pred_" + uuid.uuid4().hex[:8]
    conn = get_db()
    conn.execute(
        """INSERT INTO analyses
           (id, user_id, upload_id, filename, pre_image_path, post_image_path,
            input_path, output_path, mask_path, heatmap_path,
            status, severity_score, damage_percentage, risk_level, affected_regions,
            buildings_damaged, estimated_population, class_distribution, regions,
            model_version, inference_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            aid,
            data["user_id"],
            data["upload_id"],
            data.get("filename", ""),
            data.get("pre_image_path", ""),
            data.get("post_image_path", ""),
            data.get("pre_image_path", ""),  # input_path = pre for backward compat
            data.get("output_path", ""),
            data.get("mask_path", ""),
            data.get("heatmap_path", ""),
            data.get("status", "completed"),
            data.get("severity_score", 0),
            data.get("damage_percentage", 0),
            data.get("risk_level", "low"),
            data.get("affected_regions", 0),
            data.get("buildings_damaged", 0),
            data.get("estimated_population", 0),
            json.dumps(data.get("class_distribution", [])),
            json.dumps(data.get("regions", [])),
            data.get("model_version", "unet-disaster-v2.0"),
            data.get("inference_ms", 0),
        ),
    )
    conn.commit()
    conn.close()
    return aid


def get_analysis(aid: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM analyses WHERE id = ?", (aid,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["class_distribution"] = json.loads(d["class_distribution"])
    d["regions"] = json.loads(d["regions"])
    return d


def list_analyses(user_id: str = None, limit: int = 20) -> list:
    conn = get_db()
    if user_id:
        rows = conn.execute(
            "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM analyses ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    conn.close()
    results = []
    for row in rows:
        d = dict(row)
        d["class_distribution"] = json.loads(d["class_distribution"])
        d["regions"] = json.loads(d["regions"])
        results.append(d)
    return results
