# FungiGuard Backend

API backend untuk klasifikasi jamur menggunakan model Random Forest yang sudah dilatih.

## Menjalankan

```bash
# Install dependencies
pip install -r requirements.txt

# Jalankan server
uvicorn main:app --reload
```

Server akan berjalan di `http://localhost:8000`.

## Endpoint

- `GET /api/features` — Daftar 10 fitur input beserta opsi
- `POST /api/predict` — Prediksi klasifikasi jamur
- `GET /api/training-report` — Data laporan pelatihan model
- `/static/` — File gambar hasil pelatihan (PNG)
