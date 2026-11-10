import os
import json
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, model_validator


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

# ---------------------------------------------------------------------------
# Feature definitions (order must match fungiguard_selected_features.joblib)
# ---------------------------------------------------------------------------
FEATURES_META = [
    {
        "key": "odor",
        "label": "Bau jamur",
        "description": "Aroma yang dihasilkan jamur saat dipotong atau dipatahkan",
        "options": [
            {"value": "a", "label": "Almond"},
            {"value": "l", "label": "Adas manis (anise)"},
            {"value": "c", "label": "Kreosot"},
            {"value": "y", "label": "Amis (ikan)"},
            {"value": "f", "label": "Busuk"},
            {"value": "m", "label": "Apek"},
            {"value": "n", "label": "Tidak berbau"},
            {"value": "p", "label": "Tajam (pungent)"},
            {"value": "s", "label": "Pedas (spicy)"},
        ],
    },
    {
        "key": "spore-print-color",
        "label": "Warna cetak spora",
        "description": "Warna jejak spora yang jatuh dari tudung jamur ke permukaan di bawahnya",
        "options": [
            {"value": "b", "label": "Krem (buff)"},
            {"value": "h", "label": "Cokelat tua"},
            {"value": "k", "label": "Hitam"},
            {"value": "n", "label": "Cokelat"},
            {"value": "o", "label": "Oranye"},
            {"value": "r", "label": "Hijau"},
            {"value": "u", "label": "Ungu"},
            {"value": "w", "label": "Putih"},
            {"value": "y", "label": "Kuning"},
        ],
    },
    {
        "key": "gill-color",
        "label": "Warna bilah insang",
        "description": "Warna bilah tipis (lamela) di bawah tudung jamur",
        "options": [
            {"value": "b", "label": "Krem"},
            {"value": "e", "label": "Merah"},
            {"value": "g", "label": "Abu-abu"},
            {"value": "h", "label": "Cokelat tua"},
            {"value": "k", "label": "Hitam"},
            {"value": "n", "label": "Cokelat"},
            {"value": "o", "label": "Oranye"},
            {"value": "p", "label": "Merah muda"},
            {"value": "r", "label": "Hijau"},
            {"value": "u", "label": "Ungu"},
            {"value": "w", "label": "Putih"},
            {"value": "y", "label": "Kuning"},
        ],
    },
    {
        "key": "ring-type",
        "label": "Jenis cincin pada batang",
        "description": "Bentuk dan sifat cincin (annulus) yang mengelilingi batang jamur",
        "options": [
            {"value": "e", "label": "Cepat hilang (evanescent)"},
            {"value": "f", "label": "Melebar (flaring)"},
            {"value": "l", "label": "Besar"},
            {"value": "n", "label": "Tidak ada"},
            {"value": "p", "label": "Menggantung (pendant)"},
        ],
    },
    {
        "key": "stalk-surface-above-ring",
        "label": "Tekstur batang di atas cincin",
        "description": "Tekstur permukaan batang di bagian atas cincin",
        "options": [
            {"value": "f", "label": "Berserat"},
            {"value": "k", "label": "Seperti sutra"},
            {"value": "s", "label": "Halus"},
            {"value": "y", "label": "Bersisik"},
        ],
    },
    {
        "key": "stalk-surface-below-ring",
        "label": "Tekstur batang di bawah cincin",
        "description": "Tekstur permukaan batang di bagian bawah cincin",
        "options": [
            {"value": "f", "label": "Berserat"},
            {"value": "k", "label": "Seperti sutra"},
            {"value": "s", "label": "Halus"},
            {"value": "y", "label": "Bersisik"},
        ],
    },
    {
        "key": "stalk-color-above-ring",
        "label": "Warna batang di atas cincin",
        "description": "Warna batang di bagian atas cincin",
        "options": [
            {"value": "b", "label": "Krem"},
            {"value": "c", "label": "Kayu manis"},
            {"value": "e", "label": "Merah"},
            {"value": "g", "label": "Abu-abu"},
            {"value": "n", "label": "Cokelat"},
            {"value": "o", "label": "Oranye"},
            {"value": "p", "label": "Merah muda"},
            {"value": "w", "label": "Putih"},
            {"value": "y", "label": "Kuning"},
        ],
    },
    {
        "key": "stalk-color-below-ring",
        "label": "Warna batang di bawah cincin",
        "description": "Warna batang di bagian bawah cincin",
        "options": [
            {"value": "b", "label": "Krem"},
            {"value": "c", "label": "Kayu manis"},
            {"value": "e", "label": "Merah"},
            {"value": "g", "label": "Abu-abu"},
            {"value": "n", "label": "Cokelat"},
            {"value": "o", "label": "Oranye"},
            {"value": "p", "label": "Merah muda"},
            {"value": "w", "label": "Putih"},
            {"value": "y", "label": "Kuning"},
        ],
    },
    {
        "key": "gill-size",
        "label": "Ukuran bilah insang",
        "description": "Ukuran relatif bilah insang (lamela) di bawah tudung",
        "options": [
            {"value": "b", "label": "Lebar"},
            {"value": "n", "label": "Sempit"},
        ],
    },
    {
        "key": "population",
        "label": "Pola populasi",
        "description": "Pola penyebaran saat tumbuh di habitat alaminya",
        "options": [
            {"value": "a", "label": "Melimpah"},
            {"value": "c", "label": "Mengelompok"},
            {"value": "n", "label": "Banyak"},
            {"value": "s", "label": "Tersebar"},
            {"value": "v", "label": "Beberapa"},
            {"value": "y", "label": "Soliter"},
        ],
    },
]

# Build valid-values lookup for validation
VALID_VALUES: dict[str, set[str]] = {
    f["key"]: {o["value"] for o in f["options"]} for f in FEATURES_META
}


# ---------------------------------------------------------------------------
# Pydantic request model
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    odor: str
    spore_print_color: str
    gill_color: str
    ring_type: str
    stalk_surface_above_ring: str
    stalk_surface_below_ring: str
    stalk_color_above_ring: str
    stalk_color_below_ring: str
    gill_size: str
    population: str

    class Config:
        # Allow JSON keys with hyphens to map to underscored field names
        populate_by_name = True

    @model_validator(mode="before")
    @classmethod
    def remap_hyphens(cls, data):
        """Accept JSON keys with hyphens (matching feature names)."""
        if isinstance(data, dict):
            mapping = {
                "spore-print-color": "spore_print_color",
                "gill-color": "gill_color",
                "ring-type": "ring_type",
                "stalk-surface-above-ring": "stalk_surface_above_ring",
                "stalk-surface-below-ring": "stalk_surface_below_ring",
                "stalk-color-above-ring": "stalk_color_above_ring",
                "stalk-color-below-ring": "stalk_color_below_ring",
                "gill-size": "gill_size",
            }
            remapped = {}
            for k, v in data.items():
                remapped[mapping.get(k, k)] = v
            return remapped
        return data

    @model_validator(mode="after")
    def validate_values(self):
        """Check every field value is in the allowed set."""
        field_to_key = {
            "odor": "odor",
            "spore_print_color": "spore-print-color",
            "gill_color": "gill-color",
            "ring_type": "ring-type",
            "stalk_surface_above_ring": "stalk-surface-above-ring",
            "stalk_surface_below_ring": "stalk-surface-below-ring",
            "stalk_color_above_ring": "stalk-color-above-ring",
            "stalk_color_below_ring": "stalk-color-below-ring",
            "gill_size": "gill-size",
            "population": "population",
        }
        errors = []
        for field_name, feature_key in field_to_key.items():
            value = getattr(self, field_name)
            valid = VALID_VALUES[feature_key]
            if value not in valid:
                label = next(
                    f["label"] for f in FEATURES_META if f["key"] == feature_key
                )
                errors.append(
                    f"Nilai '{value}' tidak valid untuk {label}. "
                    f"Pilihan yang tersedia: {', '.join(sorted(valid))}"
                )
        if errors:
            raise ValueError("; ".join(errors))
        return self

    def to_feature_dict(self) -> dict[str, str]:
        """Return dict keyed by original hyphenated feature names."""
        return {
            "odor": self.odor,
            "spore-print-color": self.spore_print_color,
            "gill-color": self.gill_color,
            "ring-type": self.ring_type,
            "stalk-surface-above-ring": self.stalk_surface_above_ring,
            "stalk-surface-below-ring": self.stalk_surface_below_ring,
            "stalk-color-above-ring": self.stalk_color_above_ring,
            "stalk-color-below-ring": self.stalk_color_below_ring,
            "gill-size": self.gill_size,
            "population": self.population,
        }


# ---------------------------------------------------------------------------
# Helper: convert numpy / pandas types to JSON-safe Python types
# ---------------------------------------------------------------------------
def to_python(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: to_python(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [to_python(i) for i in obj]
    return obj


# ---------------------------------------------------------------------------
# Application state (populated at startup)
# ---------------------------------------------------------------------------
class AppState:
    model = None
    selected_features: list[str] = []
    metadata: dict = {}
    csv_data: dict = {}
    mi_lookup: dict[str, float] = {}


state = AppState()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model artifacts
    state.model = joblib.load(ARTIFACTS_DIR / "fungiguard_final_model.joblib")
    state.selected_features = joblib.load(
        ARTIFACTS_DIR / "fungiguard_selected_features.joblib"
    )
    state.metadata = to_python(
        joblib.load(ARTIFACTS_DIR / "fungiguard_metadata.joblib")
    )

    # Load CSV files
    csv_files = {
        "model_comparison": "model_comparison.csv",
        "mutual_information": "mutual_information.csv",
        "permutation_importance": "permutation_importance.csv",
        "learning_curve": "learning_curve.csv",
        "random_split_20": "random_split_20.csv",
    }
    for key, filename in csv_files.items():
        df = pd.read_csv(ARTIFACTS_DIR / filename)
        state.csv_data[key] = {
            "columns": df.columns.tolist(),
            "rows": json.loads(df.to_json(orient="records", force_ascii=False)),
        }

    # Build MI lookup from CSV data
    for row in state.csv_data["mutual_information"]["rows"]:
        state.mi_lookup[row["Fitur"]] = row["Mutual Information"]

    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="FungiGuard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(ARTIFACTS_DIR)), name="static")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/features")
def get_features():
    result = []
    for feat in FEATURES_META:
        result.append(
            {
                "key": feat["key"],
                "label": feat["label"],
                "description": feat["description"],
                "mi_score": state.mi_lookup.get(feat["key"], 0.0),
                "options": feat["options"],
            }
        )
    return result


@app.post("/api/predict")
def predict(req: PredictRequest):
    feature_dict = req.to_feature_dict()

    # Build DataFrame with exact column order from selected_features
    row = {col: feature_dict[col] for col in state.selected_features}
    df = pd.DataFrame([row], columns=state.selected_features)

    prediction = state.model.predict(df)[0]
    proba = state.model.predict_proba(df)[0]

    label = "edible" if prediction == 0 else "poisonous"
    label_id = "Dapat dimakan" if prediction == 0 else "Beracun"
    confidence = float(proba[prediction])

    return {
        "label": label,
        "label_id": label_id,
        "confidence": confidence,
        "probabilities": {
            "edible": float(proba[0]),
            "poisonous": float(proba[1]),
        },
    }


@app.get("/api/training-report")
def get_training_report():
    return {
        **state.csv_data,
        "metadata": state.metadata,
    }


# ---------------------------------------------------------------------------
# Custom validation error handler (Indonesian messages)
# ---------------------------------------------------------------------------
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

FIELD_LABELS_ID = {
    "odor": "Bau jamur",
    "spore_print_color": "Warna cetak spora",
    "spore-print-color": "Warna cetak spora",
    "gill_color": "Warna bilah insang",
    "gill-color": "Warna bilah insang",
    "ring_type": "Jenis cincin pada batang",
    "ring-type": "Jenis cincin pada batang",
    "stalk_surface_above_ring": "Tekstur batang di atas cincin",
    "stalk-surface-above-ring": "Tekstur batang di atas cincin",
    "stalk_surface_below_ring": "Tekstur batang di bawah cincin",
    "stalk-surface-below-ring": "Tekstur batang di bawah cincin",
    "stalk_color_above_ring": "Warna batang di atas cincin",
    "stalk-color-above-ring": "Warna batang di atas cincin",
    "stalk_color_below_ring": "Warna batang di bawah cincin",
    "stalk-color-below-ring": "Warna batang di bawah cincin",
    "gill_size": "Ukuran bilah insang",
    "gill-size": "Ukuran bilah insang",
    "population": "Pola populasi",
}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    messages = []
    for err in errors:
        field = err.get("loc", ["", ""])[-1] if err.get("loc") else ""
        field_label = FIELD_LABELS_ID.get(str(field), str(field))
        if err["type"] == "missing":
            messages.append(f"Karakteristik '{field_label}' wajib diisi.")
        elif err["type"] == "value_error":
            msg = str(err["msg"])
            if msg.startswith("Value error, "):
                msg = msg[len("Value error, "):]
            messages.append(msg)
        else:
            messages.append(f"Input tidak valid untuk '{field_label}': {err['msg']}")
    return JSONResponse(
        status_code=422,
        content={"detail": " ".join(messages)},
    )

