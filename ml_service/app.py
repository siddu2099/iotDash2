from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
import os
import requests

from utils.data_reporter import DataReporter
from utils.pdf_generator import PDFReportGenerator

# ========================================
# APP SETUP
# ========================================
app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/health": {"origins": "*"}
})

# Ensure model directory exists
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# ========================================
# ENVIRONMENT VARIABLES (RENDER SAFE)
# ========================================
THINGSPEAK_CHANNEL_ID = os.environ.get("THINGSPEAK_CHANNEL_ID")
THINGSPEAK_API_KEY = os.environ.get("THINGSPEAK_API_KEY")

if not THINGSPEAK_CHANNEL_ID or not THINGSPEAK_API_KEY:
    raise RuntimeError("❌ Missing ThingSpeak environment variables")

THINGSPEAK_URL = (
    f"https://api.thingspeak.com/channels/{THINGSPEAK_CHANNEL_ID}/feeds.json"
    f"?api_key={THINGSPEAK_API_KEY}&results=100"
)

# ========================================
# K-MEANS ANOMALY DETECTOR
# ========================================
class KMeansAnomalyDetector:
    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.scaler = StandardScaler()
        self.trained = False
        self.model_path = os.path.join(MODEL_DIR, "kmeans_model.pkl")
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                saved = joblib.load(self.model_path)
                self.model = saved["model"]
                self.scaler = saved["scaler"]
                self.n_clusters = saved["n_clusters"]
                self.trained = True
                print("✅ K-Means model loaded")
            except Exception as e:
                print("⚠️ Could not load model:", e)

    def _save_model(self):
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "n_clusters": self.n_clusters
        }, self.model_path)

    def train(self, data):
        data = np.array(data).reshape(-1, 1)
        if np.std(data) < 1e-5:
            self.model = KMeans(n_clusters=1, random_state=42, n_init=10)
            self.n_clusters = 1
        scaled = self.scaler.fit_transform(data)
        self.model.fit(scaled)
        self.trained = True
        self._save_model()

    def detect(self, data):
        if not self.trained:
            self.train(data)

        data = np.array(data).reshape(-1, 1)
        if np.std(data) < 1e-5:
            return np.ones(len(data))

        scaled = self.scaler.transform(data)
        labels = self.model.predict(scaled)
        centers = self.model.cluster_centers_

        distances = np.linalg.norm(scaled - centers[labels], axis=1)
        threshold = np.percentile(distances, 95)

        return np.where(distances > threshold, -1, 1)

    def calculate_severity(self, value, values):
        median = np.median(values)
        mad = np.median(np.abs(values - median))
        if mad == 0:
            return 0.5
        score = abs(value - median) / mad
        return round(min(score / 10, 1.0), 3)

    def severity_label(self, score):
        if score >= 0.7:
            return "high"
        elif score >= 0.4:
            return "medium"
        return "low"


detector = KMeansAnomalyDetector()

# ========================================
# ROUTES
# ========================================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "model": "K-Means",
        "trained": detector.trained,
        "clusters": detector.n_clusters
    }), 200


@app.route("/api/detect-anomalies", methods=["POST"])
def detect_anomalies():
    data = request.json.get("field1_data", [])

    if len(data) < 5:
        return jsonify({"error": "Minimum 5 data points required"}), 400

    values = np.array([float(x) for x in data])
    labels = detector.detect(values)

    anomalies = []
    for i, (v, l) in enumerate(zip(values, labels)):
        if l == -1:
            score = detector.calculate_severity(v, values)
            anomalies.append({
                "index": i,
                "value": round(float(v), 2),
                "severity": detector.severity_label(score),
                "severity_score": score
            })

    return jsonify({
        "success": True,
        "count": len(anomalies),
        "anomalies": anomalies
    })


@app.route("/api/train-model", methods=["POST"])
def train_model():
    data = request.json.get("training_data", [])
    if len(data) < 20:
        return jsonify({"error": "Minimum 20 samples required"}), 400
    detector.train(data)
    return jsonify({"success": True, "clusters": detector.n_clusters})


@app.route("/api/statistics", methods=["GET"])
def statistics():
    r = requests.get(THINGSPEAK_URL, timeout=10)
    feeds = r.json().get("feeds", [])

    values = [float(f["field1"]) for f in feeds if f.get("field1")]
    if not values:
        return jsonify({"error": "No data"}), 404

    return jsonify({
        "count": len(values),
        "mean": round(np.mean(values), 2),
        "std": round(np.std(values), 2),
        "min": min(values),
        "max": max(values)
    })


@app.route("/api/download-report", methods=["GET"])
def download_report():
    r = requests.get(THINGSPEAK_URL, timeout=10)
    feeds = r.json().get("feeds", [])

    report = DataReporter.generate_full_report(feeds)
    pdf = PDFReportGenerator.generate_daily_report(report, {})
    filename = PDFReportGenerator.get_filename()

    return send_file(
        pdf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )


# ========================================
# ENTRY POINT (RENDER SAFE)
# ========================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
