import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_features():
    print("\n--- A. GET /api/features ---")
    r = requests.get(f"{BASE_URL}/api/features")
    assert r.status_code == 200, f"Status code {r.status_code}"
    features = r.json()
    assert len(features) == 10, f"Expected 10 features, got {len(features)}"
    print(f"Features count: {len(features)}")
    for f in features:
        print(f" - {f['key']} ({f['label']}): {len(f['options'])} options, MI: {f['mi_score']}")
    return features

def test_predict_edible():
    print("\n--- B. POST /api/predict (Edible case) ---")
    payload = {
        "odor": "n",
        "spore-print-color": "w",
        "gill-color": "k",
        "ring-type": "p",
        "stalk-surface-above-ring": "s",
        "stalk-surface-below-ring": "s",
        "stalk-color-above-ring": "w",
        "stalk-color-below-ring": "w",
        "gill-size": "b",
        "population": "v"
    }
    r = requests.post(f"{BASE_URL}/api/predict", json=payload)
    print("Status:", r.status_code)
    data = r.json()
    print("Response:", json.dumps(data, indent=2))
    assert r.status_code == 200
    assert data["label"] == "edible", f"Expected edible, got {data['label']}"
    assert data["label_id"] == "Dapat dimakan"
    assert data["confidence"] > 0.5

def test_predict_poisonous():
    print("\n--- C. POST /api/predict (Poisonous case) ---")
    payload = {
        "odor": "f",
        "spore-print-color": "w",
        "gill-color": "k",
        "ring-type": "p",
        "stalk-surface-above-ring": "s",
        "stalk-surface-below-ring": "s",
        "stalk-color-above-ring": "w",
        "stalk-color-below-ring": "w",
        "gill-size": "b",
        "population": "v"
    }
    r = requests.post(f"{BASE_URL}/api/predict", json=payload)
    print("Status:", r.status_code)
    data = r.json()
    print("Response:", json.dumps(data, indent=2))
    assert r.status_code == 200
    assert data["label"] == "poisonous", f"Expected poisonous, got {data['label']}"
    assert data["label_id"] == "Beracun"
    assert data["confidence"] > 0.5

def test_predict_invalid():
    print("\n--- D. POST /api/predict (Validation errors: missing & invalid) ---")
    # Empty / missing fields
    r_empty = requests.post(f"{BASE_URL}/api/predict", json={"odor": "n"})
    print("Missing fields status:", r_empty.status_code)
    print("Missing fields response:", r_empty.json())
    assert r_empty.status_code == 422
    assert "detail" in r_empty.json()

    # Invalid value
    payload_invalid = {
        "odor": "XYZ",
        "spore-print-color": "w",
        "gill-color": "k",
        "ring-type": "p",
        "stalk-surface-above-ring": "s",
        "stalk-surface-below-ring": "s",
        "stalk-color-above-ring": "w",
        "stalk-color-below-ring": "w",
        "gill-size": "b",
        "population": "v"
    }
    r_invalid = requests.post(f"{BASE_URL}/api/predict", json=payload_invalid)
    print("Invalid value status:", r_invalid.status_code)
    print("Invalid value response:", r_invalid.json())
    assert r_invalid.status_code == 422
    assert "detail" in r_invalid.json()
    assert "tidak valid" in r_invalid.json()["detail"].lower()

def test_training_report_and_static():
    print("\n--- E. GET /api/training-report and static images ---")
    r = requests.get(f"{BASE_URL}/api/training-report")
    assert r.status_code == 200
    report = r.json()
    
    print("\n[model_comparison]")
    print("Columns:", report["model_comparison"]["columns"])
    for row in report["model_comparison"]["rows"]:
        print(" ", row)

    print("\n[permutation_importance top 4]")
    print("Columns:", report["permutation_importance"]["columns"])
    for row in report["permutation_importance"]["rows"][:4]:
        print(" ", row)

    print("\n[learning_curve]")
    print("Columns:", report["learning_curve"]["columns"])
    for row in report["learning_curve"]["rows"]:
        print(" ", row)

    print("\n[random_split_20 summary]")
    print("Columns:", report["random_split_20"]["columns"])
    rows = report["random_split_20"]["rows"]
    print(f"Total rows: {len(rows)}")
    all_100 = all(row.get("Accuracy (%)") == 100.0 for row in rows)
    all_zero_fn = all(row.get("Poisonous Predicted Edible") == 0 for row in rows)
    print(f"All 100% accuracy: {all_100}, All 0 false negatives: {all_zero_fn}")

    # Test static images
    images = [
        "distribusi_target.png",
        "mutual_information.png",
        "confusion_matrix.png",
        "permutation_importance.png",
        "learning_curve.png"
    ]
    print("\n[Static images check]")
    for img in images:
        r_img = requests.get(f"{BASE_URL}/static/{img}")
        print(f" - /static/{img}: status={r_img.status_code}, size={len(r_img.content)} bytes, content-type={r_img.headers.get('content-type')}")
        assert r_img.status_code == 200
        assert "image/png" in r_img.headers.get("content-type", "")

if __name__ == "__main__":
    try:
        test_features()
        test_predict_edible()
        test_predict_poisonous()
        test_predict_invalid()
        test_training_report_and_static()
        print("\n>>> ALL BACKEND TESTS PASSED SUCCESSFULLY! <<<")
    except Exception as e:
        print("\nFAILED:", e)
        sys.exit(1)
