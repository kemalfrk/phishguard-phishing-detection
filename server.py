"""
PhishGuard — Flask Backend API
Loads trained sklearn models and serves predictions for the GUI.
"""

import os
import json
import joblib
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd

# The project root directory (where index.html, style.css, app.js live)
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=PROJECT_DIR, static_url_path='/datascience_donem_proje')
CORS(app)  # Allow cross-origin requests from the frontend


@app.route('/')
def serve_index():
    """Serve the main GUI page."""
    return send_from_directory(PROJECT_DIR, 'index.html')

# ─── Model Registry ────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__))

AVAILABLE_MODELS = {
    "random_forest": {
        "file": "en_iyi_random_forest_modeli.pkl",
        "name": "Random Forest",
        "needs_scaling": False,
        "accuracy": 97.33,
    },
    "decision_tree": {
        "file": "en_iyi_karar_agaci_modeli.pkl",
        "name": "Decision Tree",
        "needs_scaling": False,
        "accuracy": 96.11,
    },
    "svm": {
        "file": "en_iyi_svm_modeli.pkl",
        "name": "SVM",
        "needs_scaling": True,
        "accuracy": 96.79,
    },
    "knn": {
        "file": "en_iyi_knn_modeli.pkl",
        "name": "KNN",
        "needs_scaling": True,
        "accuracy": 95.39,
    },
    "logistic_regression": {
        "file": "en_iyi_lojistik_regresyon_modeli.pkl",
        "name": "Logistic Regression",
        "needs_scaling": True,
        "accuracy": 92.76,
    },
    "ann": {
        "file": "en_iyi_ann_modeli.pkl",
        "name": "ANN (Neural Network)",
        "needs_scaling": True,
        "accuracy": 96.56,
    },
}

# The 30 feature names in the exact order the model expects
FEATURE_NAMES = [
    "having_IP_Address",
    "URL_Length",
    "Shortining_Service",
    "having_At_Symbol",
    "double_slash_redirecting",
    "Prefix_Suffix",
    "having_Sub_Domain",
    "SSLfinal_State",
    "Domain_registeration_length",
    "Favicon",
    "port",
    "HTTPS_token",
    "Request_URL",
    "URL_of_Anchor",
    "Links_in_tags",
    "SFH",
    "Submitting_to_email",
    "Abnormal_URL",
    "Redirect",
    "on_mouseover",
    "RightClick",
    "popUpWidnow",
    "Iframe",
    "age_of_domain",
    "DNSRecord",
    "web_traffic",
    "Page_Rank",
    "Google_Index",
    "Links_pointing_to_page",
    "Statistical_report",
]

# ─── Pre-load models at startup ────────────────────────────────────
loaded_models = {}

def load_models():
    """Load all .pkl models into memory."""
    for key, meta in AVAILABLE_MODELS.items():
        path = os.path.join(MODEL_DIR, meta["file"])
        if os.path.exists(path):
            try:
                loaded_models[key] = joblib.load(path)
                print(f"  [OK]  Loaded model: {meta['name']}  ({meta['file']})")
            except Exception as e:
                print(f"  [FAIL]  Failed to load {meta['name']}: {e}")
        else:
            print(f"  [WARN]  Model file not found: {path}")


# ─── Routes ─────────────────────────────────────────────────────────
@app.route("/models", methods=["GET"])
def list_models():
    """Return the list of available models and their metadata."""
    result = []
    for key, meta in AVAILABLE_MODELS.items():
        result.append({
            "id": key,
            "name": meta["name"],
            "accuracy": meta["accuracy"],
            "loaded": key in loaded_models,
        })
    return jsonify(result)


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accept a JSON body with:
      {
        "model": "random_forest",          // optional, defaults to random_forest
        "features": {                      // all 30 features as integers -1, 0, or 1
          "having_IP_Address": 1,
          "URL_Length": -1,
          ...
        }
      }
    Returns:
      {
        "prediction": "safe" | "phishing",
        "confidence": 97.33,
        "model_name": "Random Forest",
        "features_used": { ... }
      }
    """
    data = request.get_json(force=True)

    # --- choose model ------------------------------------------------
    model_key = data.get("model", "random_forest")
    if model_key not in loaded_models:
        return jsonify({"error": f"Model '{model_key}' is not loaded or does not exist."}), 400

    model = loaded_models[model_key]
    meta = AVAILABLE_MODELS[model_key]

    # --- build feature vector ----------------------------------------
    features_dict = data.get("features", {})
    feature_vector = []

    for name in FEATURE_NAMES:
        val = features_dict.get(name, 1)  # default to 1 (legitimate) if not provided
        # Clamp to valid values
        if val not in (-1, 0, 1):
            try:
                val = int(round(float(val)))
            except (ValueError, TypeError):
                val = 1
            val = max(-1, min(1, val))
        feature_vector.append(val)

    X = pd.DataFrame([feature_vector], columns=FEATURE_NAMES)

    # --- predict -----------------------------------------------------
    try:
        prediction_raw = model.predict(X)[0]
        # In the dataset: 1 = legitimate, -1 = phishing
        is_safe = int(prediction_raw) == 1

        # Try to get probability if the model supports it
        confidence = meta["accuracy"]  # fallback to model accuracy
        try:
            proba = model.predict_proba(X)[0]
            proba_confidence = round(float(max(proba)) * 100, 2)
            if proba_confidence > 80:
                confidence = proba_confidence
        # 80 altıysa zaten yukarıda meta["accuracy"] olarak set edildi, olduğu gibi kalır
        except AttributeError:
            pass

        return jsonify({
            "prediction": "safe" if is_safe else "phishing",
            "confidence": confidence,
            "model_name": meta["name"],
            "features_used": dict(zip(FEATURE_NAMES, feature_vector)),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models_loaded": len(loaded_models)})


# ─── Startup ────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n--- PhishGuard --- Loading models...")
    load_models()
    print(f"\n>>> Starting server on http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
