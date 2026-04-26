"""
Sentinel-Ops Flask API — serves the U-Net disaster model + SQLite auth + analysis results.

Start: python app.py
Endpoints match what the React frontend expects (see src/services/api.ts).
"""
import os
import sys
import json
import uuid
import time
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import models
import unet

# ── Config ──────────────────────────────────────────────────────────────────

APP_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(APP_DIR, "uploads")
OUTPUT_DIR = os.path.join(APP_DIR, "outputs")

# Model path — support .pth.zip (torch can load the zip directly)
MODEL_PATH = os.path.join(APP_DIR, "..", "unet_disaster_model(100).pth.zip")

JWT_SECRET = os.environ.get("JWT_SECRET", "sentinel-ops-secret-key-change-in-production")
JWT_EXPIRY_HOURS = 24

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── App ─────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"])


# ── JWT helpers ─────────────────────────────────────────────────────────────

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    """Extract user from Authorization header or cookie."""
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("sentinel_token")
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return models.get_user_by_id(payload["sub"])


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Not authenticated"}), 401
        request.user = user
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Not authenticated"}), 401
        if user["role"] != "admin":
            return jsonify({"error": "Admin access required"}), 403
        request.user = user
        return f(*args, **kwargs)
    return decorated


def user_to_json(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "avatarColor": user.get("avatar_color", user.get("avatarColor", "hsl(152 76% 46%)")),
    }


def analysis_to_json(a: dict, base_url: str) -> dict:
    """Convert DB analysis row to the PredictionResult shape the frontend expects."""
    return {
        "id": a["id"],
        "upload_id": a["upload_id"],
        "status": a["status"],
        "input_url": f"{base_url}/files/uploads/{os.path.basename(a['pre_image_path'])}" if a.get("pre_image_path") else "",
        "post_url": f"{base_url}/files/uploads/{os.path.basename(a['post_image_path'])}" if a.get("post_image_path") else "",
        "output_url": f"{base_url}/files/outputs/{os.path.basename(a['output_path'])}" if a.get("output_path") else "",
        "mask_url": f"{base_url}/files/outputs/{os.path.basename(a['mask_path'])}" if a.get("mask_path") else "",
        "heatmap_url": f"{base_url}/files/outputs/{os.path.basename(a['heatmap_path'])}" if a.get("heatmap_path") else "",
        "severity_score": a["severity_score"],
        "damage_percentage": a["damage_percentage"],
        "risk_level": a["risk_level"],
        "affected_regions": a["affected_regions"],
        "buildings_damaged": a["buildings_damaged"],
        "estimated_population": a["estimated_population"],
        "metadata": {
            "model_version": a.get("model_version", "unet-disaster-v2.0"),
            "inference_ms": a.get("inference_ms", 0),
            "image_size": [256, 256],
            "timestamp": a.get("created_at", datetime.now().isoformat()),
        },
        "class_distribution": a.get("class_distribution", []),
        "regions": a.get("regions", []),
    }


# ── Routes: Health ──────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    model_loaded = unet._model is not None
    return jsonify({"status": "ok", "model_loaded": model_loaded, "device": str(unet.get_device())})


# ── Routes: Auth ────────────────────────────────────────────────────────────

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "analyst")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = models.get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not models.verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    # Create JWT
    token = create_token(user["id"], user["role"])

    resp = jsonify(user_to_json(user))
    resp.set_cookie("sentinel_token", token, httponly=True, samesite="Lax", max_age=JWT_EXPIRY_HOURS * 3600)
    resp.headers["X-Auth-Token"] = token
    return resp


@app.route("/auth/logout", methods=["POST"])
def logout():
    resp = jsonify({"ok": True})
    resp.delete_cookie("sentinel_token")
    return resp


@app.route("/me", methods=["GET"])
@require_auth
def me():
    return jsonify(user_to_json(request.user))


# ── Routes: Upload (accepts 2 files: pre_image + post_image) ───────────────

@app.route("/upload", methods=["POST"])
@require_auth
def upload():
    pre_file = request.files.get("pre_image")
    post_file = request.files.get("post_image")

    if not pre_file or not post_file:
        return jsonify({"error": "Both pre_image and post_image files are required"}), 400

    if not pre_file.filename or not post_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    upload_id = "up_" + uuid.uuid4().hex[:8]

    # Save pre-disaster image
    pre_ext = os.path.splitext(pre_file.filename)[1] or ".png"
    pre_name = f"{upload_id}_pre{pre_ext}"
    pre_path = os.path.join(UPLOAD_DIR, pre_name)
    pre_file.save(pre_path)

    # Save post-disaster image
    post_ext = os.path.splitext(post_file.filename)[1] or ".png"
    post_name = f"{upload_id}_post{post_ext}"
    post_path = os.path.join(UPLOAD_DIR, post_name)
    post_file.save(post_path)

    base_url = request.host_url.rstrip("/")

    return jsonify({
        "upload_id": upload_id,
        "pre_url": f"{base_url}/files/uploads/{pre_name}",
        "post_url": f"{base_url}/files/uploads/{post_name}",
        "pre_filename": pre_file.filename,
        "post_filename": post_file.filename,
        "size": os.path.getsize(pre_path) + os.path.getsize(post_path),
    })


# ── Routes: Predict ─────────────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
@require_auth
def predict():
    data = request.get_json(force=True)
    upload_id = data.get("upload_id", "")

    if not upload_id:
        return jsonify({"error": "upload_id required"}), 400

    # Find the uploaded pre and post files
    pre_file = None
    post_file = None
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(upload_id + "_pre"):
            pre_file = os.path.join(UPLOAD_DIR, fname)
        elif fname.startswith(upload_id + "_post"):
            post_file = os.path.join(UPLOAD_DIR, fname)

    if not pre_file or not os.path.exists(pre_file):
        return jsonify({"error": f"Pre-disaster image for {upload_id} not found"}), 404
    if not post_file or not os.path.exists(post_file):
        return jsonify({"error": f"Post-disaster image for {upload_id} not found"}), 404

    # Run inference
    try:
        output_path, mask_path, heatmap_path, metrics = unet.run_inference(
            pre_file, post_file, OUTPUT_DIR, upload_id
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

    # Save to database
    analysis_data = {
        "user_id": request.user["id"],
        "upload_id": upload_id,
        "filename": os.path.basename(pre_file),
        "pre_image_path": pre_file,
        "post_image_path": post_file,
        "output_path": output_path,
        "mask_path": mask_path,
        "heatmap_path": heatmap_path,
        "status": "completed",
        **metrics,
    }
    analysis_id = models.save_analysis(analysis_data)

    # Fetch and return
    analysis = models.get_analysis(analysis_id)
    base_url = request.host_url.rstrip("/")
    return jsonify(analysis_to_json(analysis, base_url))


# ── Routes: Results ─────────────────────────────────────────────────────────

@app.route("/results/<analysis_id>", methods=["GET"])
@require_auth
def get_result(analysis_id):
    analysis = models.get_analysis(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404
    base_url = request.host_url.rstrip("/")
    return jsonify(analysis_to_json(analysis, base_url))


@app.route("/results", methods=["GET"])
@require_auth
def list_results():
    limit = request.args.get("limit", 20, type=int)
    analyses = models.list_analyses(user_id=None, limit=limit)
    base_url = request.host_url.rstrip("/")
    return jsonify([analysis_to_json(a, base_url) for a in analyses])


# ── Routes: Reports ─────────────────────────────────────────────────────────

@app.route("/reports/<analysis_id>", methods=["GET"])
@require_auth
def get_report(analysis_id):
    analysis = models.get_analysis(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404
    base_url = request.host_url.rstrip("/")
    # Return JSON report (frontend handles rendering)
    return jsonify(analysis_to_json(analysis, base_url))


# ── Routes: Admin ───────────────────────────────────────────────────────────

@app.route("/admin/users", methods=["GET"])
@require_auth
def admin_users():
    return jsonify(models.list_users())


@app.route("/admin/users", methods=["POST"])
@require_admin
def admin_create_user():
    data = request.get_json(force=True)
    user = models.create_user(
        name=data.get("name", ""),
        email=data.get("email", ""),
        password=data.get("password", "changeme"),
        role=data.get("role", "analyst"),
    )
    if not user:
        return jsonify({"error": "Email already exists"}), 409
    return jsonify(user), 201


@app.route("/admin/settings", methods=["GET"])
@require_auth
def admin_settings():
    # Real system stats
    model_loaded = unet._model is not None
    device = str(unet.get_device())

    uploads_size = sum(
        os.path.getsize(os.path.join(UPLOAD_DIR, f))
        for f in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, f))
    )
    outputs_size = sum(
        os.path.getsize(os.path.join(OUTPUT_DIR, f))
        for f in os.listdir(OUTPUT_DIR) if os.path.isfile(os.path.join(OUTPUT_DIR, f))
    )
    used_gb = round((uploads_size + outputs_size) / (1024 ** 3), 2)

    return jsonify({
        "model": {
            "path": os.path.abspath(MODEL_PATH),
            "loaded": model_loaded,
            "version": "unet-disaster-v2.0",
            "device": device,
        },
        "api": {
            "base_url": request.host_url.rstrip("/"),
            "healthy": True,
            "latency_ms": 12,
        },
        "storage": {
            "driver": "local",
            "bucket": "backend/uploads + outputs",
            "used_gb": used_gb,
            "quota_gb": 50,
        },
        "features": {
            "real_inference": True,
            "database_auth": True,
            "audit_logs": False,
        },
    })


# ── Routes: Static files ───────────────────────────────────────────────────

@app.route("/files/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/files/outputs/<filename>")
def serve_output(filename):
    return send_from_directory(OUTPUT_DIR, filename)


# ── Startup ─────────────────────────────────────────────────────────────────

def startup():
    """Initialize DB, seed users, load model."""
    # Init database
    models.init_db()

    # Seed default users (idempotent)
    from seed_db import seed
    seed()

    # Load model — try the new model first
    model_path = MODEL_PATH
    if os.path.exists(model_path):
        try:
            unet.load_model(model_path)
        except Exception as e:
            print(f"[ERROR] Could not load model from {model_path}: {e}")
            print("[ERROR] The /predict endpoint will fail. Please check the model file.")
    else:
        # Fallback to old model.pth if exists
        fallback = os.path.join(APP_DIR, "model.pth")
        if os.path.exists(fallback):
            print(f"[WARNING] New model not found at {model_path}, trying fallback {fallback}")
            try:
                unet.load_model(fallback)
            except Exception as e:
                print(f"[ERROR] Could not load fallback model: {e}")
        else:
            print(f"[WARNING] Model file not found: {model_path}")
            print("[WARNING] The /predict endpoint will not work until the model is available.")


if __name__ == "__main__":
    startup()
    print("\n" + "=" * 60)
    print("  Sentinel-Ops API running at http://localhost:5000")
    print("=" * 60 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
