"""
U-Net model architecture — matches the training notebook (load.ipynb).
Takes 6 input channels (pre-disaster RGB + post-disaster RGB concatenated) and
outputs a 1-channel binary damage mask.
"""
import os
import time
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
import torchvision.transforms as T
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ── Architecture (must match the training notebook exactly) ─────────────────

class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    def __init__(self, in_channels=6, out_channels=1):
        super().__init__()

        self.down1 = DoubleConv(in_channels, 64)
        self.pool1 = nn.MaxPool2d(2)

        self.down2 = DoubleConv(64, 128)
        self.pool2 = nn.MaxPool2d(2)

        self.down3 = DoubleConv(128, 256)
        self.pool3 = nn.MaxPool2d(2)

        self.down4 = DoubleConv(256, 512)
        self.pool4 = nn.MaxPool2d(2)

        self.bottleneck = DoubleConv(512, 1024)

        self.up4 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.conv4 = DoubleConv(1024, 512)

        self.up3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.conv3 = DoubleConv(512, 256)

        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.conv2 = DoubleConv(256, 128)

        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.conv1 = DoubleConv(128, 64)

        self.final = nn.Conv2d(64, out_channels, 1)

    def forward(self, x):
        d1 = self.down1(x)
        d2 = self.down2(self.pool1(d1))
        d3 = self.down3(self.pool2(d2))
        d4 = self.down4(self.pool3(d3))

        bottleneck = self.bottleneck(self.pool4(d4))

        u4 = self.up4(bottleneck)
        u4 = torch.cat([u4, d4], dim=1)
        u4 = self.conv4(u4)

        u3 = self.up3(u4)
        u3 = torch.cat([u3, d3], dim=1)
        u3 = self.conv3(u3)

        u2 = self.up2(u3)
        u2 = torch.cat([u2, d2], dim=1)
        u2 = self.conv2(u2)

        u1 = self.up1(u2)
        u1 = torch.cat([u1, d1], dim=1)
        u1 = self.conv1(u1)

        return self.final(u1)


# ── Model loading ───────────────────────────────────────────────────────────

_model = None
_device = None


def get_device():
    global _device
    if _device is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return _device


def load_model(model_path: str):
    """Load the trained U-Net weights (supports .pth, .zip, or checkpoint dir)."""
    global _model
    device = get_device()
    _model = UNet(in_channels=6, out_channels=1).to(device)

    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    if isinstance(checkpoint, dict):
        if "model_state_dict" in checkpoint:
            _model.load_state_dict(checkpoint["model_state_dict"])
        elif "state_dict" in checkpoint:
            _model.load_state_dict(checkpoint["state_dict"])
        else:
            _model.load_state_dict(checkpoint)
    elif isinstance(checkpoint, nn.Module):
        _model = checkpoint.to(device)
    else:
        raise ValueError(f"Unexpected checkpoint type: {type(checkpoint)}")

    _model.eval()
    print(f"[unet] Model loaded on {device} from {model_path}")
    return _model


def get_model():
    if _model is None:
        raise RuntimeError("Model not loaded — call load_model() first")
    return _model


# ── Preprocessing (matches training notebook) ──────────────────────────────

_transform = T.Compose([
    T.Resize((256, 256)),
    T.ToTensor(),
])


def preprocess_pair(pre_path: str, post_path: str) -> torch.Tensor:
    """
    Open pre-disaster and post-disaster images as RGB, resize to 256×256,
    convert to tensors, and concatenate along the channel axis → (1, 6, 256, 256).
    """
    pre = Image.open(pre_path).convert("RGB")
    post = Image.open(post_path).convert("RGB")
    pre_t = _transform(pre)   # (3, 256, 256)
    post_t = _transform(post)  # (3, 256, 256)
    combined = torch.cat([pre_t, post_t], dim=0)  # (6, 256, 256)
    return combined.unsqueeze(0).to(get_device())  # (1, 6, 256, 256)


# ── Inference ───────────────────────────────────────────────────────────────

def run_inference(pre_path: str, post_path: str, output_dir: str, upload_id: str):
    """
    Run U-Net prediction on a pre/post disaster image pair.
    Returns (output_path, mask_path, heatmap_path, metrics_dict).
    """
    model = get_model()
    device = get_device()

    # Preprocess
    input_tensor = preprocess_pair(pre_path, post_path)

    # Inference
    start = time.time()
    with torch.no_grad():
        raw_output = model(input_tensor)
        output = torch.sigmoid(raw_output)
    inference_ms = int((time.time() - start) * 1000)

    # Binary mask (threshold at 0.5)
    mask_tensor = (output > 0.5).float()
    mask_np = mask_tensor.squeeze().cpu().numpy()  # (256, 256) values 0 or 1

    # Probability map (continuous 0-1 for heatmap)
    prob_np = output.squeeze().cpu().numpy()  # (256, 256) values 0-1

    # Save binary mask as grayscale PNG
    mask_uint8 = (mask_np * 255).astype(np.uint8)
    output_path = os.path.join(output_dir, f"{upload_id}_output.png")
    Image.fromarray(mask_uint8, mode="L").save(output_path)

    # Create a color damage mask (red overlay for frontend)
    mask_rgb = np.zeros((256, 256, 3), dtype=np.uint8)
    mask_rgb[:, :, 0] = (prob_np * 255).astype(np.uint8)  # Red channel = damage intensity
    mask_rgb[:, :, 1] = (prob_np * 50).astype(np.uint8)   # Slight green
    mask_path = os.path.join(output_dir, f"{upload_id}_mask.png")
    Image.fromarray(mask_rgb, mode="RGB").save(mask_path)

    # Create heatmap overlay on the post-disaster image
    heatmap_path = create_heatmap_overlay(post_path, prob_np, output_dir, upload_id)

    # Compute metrics from the binary mask
    metrics = compute_damage_metrics(mask_np, prob_np)
    metrics["inference_ms"] = inference_ms

    return output_path, mask_path, heatmap_path, metrics


def create_heatmap_overlay(post_path: str, prob_np: np.ndarray, output_dir: str, upload_id: str) -> str:
    """Create a jet-colormap heatmap overlaid on the post-disaster image."""
    post_img = Image.open(post_path).convert("RGB").resize((256, 256))
    post_np = np.array(post_img).astype(np.float32) / 255.0

    # Normalize probability map
    p = prob_np.copy()
    pmax = p.max()
    if pmax > 0:
        p = p / pmax

    # Create heatmap using jet colormap
    heatmap = plt.cm.jet(p)[:, :, :3]  # (256, 256, 3), drop alpha

    # Overlay: blend post image with heatmap
    overlay = (0.6 * post_np + 0.4 * heatmap).clip(0, 1)
    overlay_uint8 = (overlay * 255).astype(np.uint8)

    heatmap_path = os.path.join(output_dir, f"{upload_id}_heatmap.png")
    Image.fromarray(overlay_uint8, mode="RGB").save(heatmap_path)
    return heatmap_path


def compute_damage_metrics(mask_np: np.ndarray, prob_np: np.ndarray) -> dict:
    """
    Compute severity score, damage percentage, class distribution, and region breakdown
    from the binary damage mask and probability map.
    """
    total_pixels = mask_np.shape[0] * mask_np.shape[1]

    # Use probability map for graded thresholds
    no_damage = np.sum(prob_np < 0.15)
    minor = np.sum((prob_np >= 0.15) & (prob_np < 0.35))
    major = np.sum((prob_np >= 0.35) & (prob_np < 0.6))
    destroyed = np.sum(prob_np >= 0.6)

    no_damage_pct = round(float(no_damage) / total_pixels * 100, 1)
    minor_pct = round(float(minor) / total_pixels * 100, 1)
    major_pct = round(float(major) / total_pixels * 100, 1)
    destroyed_pct = round(float(destroyed) / total_pixels * 100, 1)

    # Overall damage percentage (from binary mask)
    changed_pixels = float(mask_np.sum())
    damage_percentage = round(changed_pixels / total_pixels * 100, 1)

    # Severity score (0-100, weighted)
    severity_score = round(minor_pct * 0.3 + major_pct * 0.7 + destroyed_pct * 1.0)
    severity_score = min(100, max(0, severity_score))

    # Risk level
    if severity_score >= 75:
        risk_level = "critical"
    elif severity_score >= 50:
        risk_level = "high"
    elif severity_score >= 25:
        risk_level = "moderate"
    else:
        risk_level = "low"

    # Heuristic estimates
    damaged_area_ratio = damage_percentage / 100
    buildings_damaged = int(damaged_area_ratio * 500)
    estimated_population = int(damaged_area_ratio * 12000)

    class_distribution = [
        {"label": "No damage", "value": no_damage_pct, "color": "hsl(var(--severity-low))"},
        {"label": "Minor", "value": minor_pct, "color": "hsl(var(--severity-moderate))"},
        {"label": "Major", "value": major_pct, "color": "hsl(var(--severity-high))"},
        {"label": "Destroyed", "value": destroyed_pct, "color": "hsl(var(--severity-critical))"},
    ]

    regions = compute_region_breakdown(prob_np)

    return {
        "severity_score": severity_score,
        "damage_percentage": damage_percentage,
        "risk_level": risk_level,
        "buildings_damaged": buildings_damaged,
        "estimated_population": estimated_population,
        "class_distribution": class_distribution,
        "regions": regions,
        "affected_regions": len([r for r in regions if r["severity"] >= 25]),
    }


def compute_region_breakdown(prob_np: np.ndarray) -> list:
    """Divide image into grid regions and compute severity per region."""
    h, w = prob_np.shape
    grid_rows, grid_cols = 4, 4
    rh, rw = h // grid_rows, w // grid_cols

    region_names = [
        "Sector NW-1", "Sector N-1", "Sector N-2", "Sector NE-1",
        "Sector W-1", "Sector C-1", "Sector C-2", "Sector E-1",
        "Sector W-2", "Sector C-3", "Sector C-4", "Sector E-2",
        "Sector SW-1", "Sector S-1", "Sector S-2", "Sector SE-1",
    ]

    base_lat, base_lng = 13.08, 80.27

    regions = []
    idx = 0
    for r in range(grid_rows):
        for c in range(grid_cols):
            patch = prob_np[r * rh:(r + 1) * rh, c * rw:(c + 1) * rw]
            mean_val = float(np.mean(patch))
            severity = int(min(100, mean_val * 150))

            if severity >= 10:
                regions.append({
                    "id": f"r{idx}",
                    "name": region_names[idx],
                    "severity": severity,
                    "lat": round(base_lat + r * 0.003, 3),
                    "lng": round(base_lng + c * 0.004, 3),
                })
            idx += 1

    regions.sort(key=lambda x: x["severity"], reverse=True)
    return regions[:8]
