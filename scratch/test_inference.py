"""
Quick test of the inference pipeline using two test images as pre/post disaster.
"""
import requests
import json

BASE = "http://localhost:5000"

# Login first
print("1. Logging in...")
resp = requests.post(f"{BASE}/auth/login", json={
    "email": "admin@sentinel.io",
    "password": "admin123",
    "role": "admin"
})
print(f"   Status: {resp.status_code}")
token = resp.headers.get("X-Auth-Token")
print(f"   Token: {token[:20]}..." if token else "   No token!")
headers = {"Authorization": f"Bearer {token}"}

# Upload pre/post images
print("\n2. Uploading pre/post images...")
pre_path = r"TEST IMAGE\WhatsApp Image 2026-04-24 at 22.07.06.jpeg"
post_path = r"TEST IMAGE\WhatsApp Image 2026-04-24 at 22.07.06 (1).jpeg"

with open(pre_path, "rb") as pre, open(post_path, "rb") as post:
    files = {
        "pre_image": ("pre.jpg", pre, "image/jpeg"),
        "post_image": ("post.jpg", post, "image/jpeg"),
    }
    resp = requests.post(f"{BASE}/upload", files=files, headers=headers)
print(f"   Status: {resp.status_code}")
upload_data = resp.json()
print(f"   Upload ID: {upload_data.get('upload_id')}")
print(f"   Pre URL: {upload_data.get('pre_url')}")
print(f"   Post URL: {upload_data.get('post_url')}")

# Run prediction
print("\n3. Running prediction...")
resp = requests.post(f"{BASE}/predict", json={"upload_id": upload_data["upload_id"]}, headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    pred = resp.json()
    print(f"   Damage %: {pred['damage_percentage']}")
    print(f"   Severity: {pred['severity_score']}")
    print(f"   Risk: {pred['risk_level']}")
    print(f"   Mask URL: {pred['mask_url']}")
    print(f"   Heatmap URL: {pred['heatmap_url']}")
    print(f"   Output URL: {pred['output_url']}")
    print(f"   Pre URL: {pred['input_url']}")
    print(f"   Post URL: {pred['post_url']}")
    print(f"   Regions: {len(pred['regions'])} detected")
    for r in pred['regions'][:3]:
        print(f"     - {r['name']}: severity {r['severity']}")
    print(f"   Class distribution:")
    for c in pred['class_distribution']:
        print(f"     - {c['label']}: {c['value']}%")
else:
    print(f"   Error: {resp.text}")

print("\nDone!")
