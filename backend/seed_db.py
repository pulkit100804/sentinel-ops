"""
Seed the database with default users.
Run: python seed_db.py
"""
from models import init_db, create_user, get_user_by_email

SEED_USERS = [
    {"name": "Dr. Maya Chen",     "email": "admin@sentinel.io",     "password": "admin123",     "role": "admin",     "avatar_color": "hsl(152 76% 46%)"},
    {"name": "Jordan Rivera",     "email": "analyst@sentinel.io",   "password": "analyst123",   "role": "analyst",   "avatar_color": "hsl(174 72% 48%)"},
    {"name": "Captain A. Okafor", "email": "responder@sentinel.io", "password": "responder123", "role": "responder", "avatar_color": "hsl(20 92% 58%)"},
    {"name": "Priya Nair",        "email": "priya@sentinel.io",     "password": "analyst123",   "role": "analyst",   "avatar_color": "hsl(42 96% 58%)"},
    {"name": "L. Thompson",       "email": "thompson@sentinel.io",  "password": "responder123", "role": "responder", "avatar_color": "hsl(0 78% 56%)"},
]


def seed():
    init_db()
    for u in SEED_USERS:
        existing = get_user_by_email(u["email"])
        if existing:
            print(f"  > User {u['email']} already exists, skipping")
            continue
        result = create_user(u["name"], u["email"], u["password"], u["role"], u["avatar_color"])
        if result:
            print(f"  + Created {u['role']:>10s}  {u['email']:<28s}  pw: {u['password']}")
        else:
            print(f"  x Failed to create {u['email']}")


if __name__ == "__main__":
    print("[seed] Seeding database...")
    seed()
    print("[seed] Done!")
