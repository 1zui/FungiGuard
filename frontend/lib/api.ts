const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FeatureOption {
  value: string;
  label: string;
}

export interface Feature {
  key: string;
  label: string;
  description: string;
  mi_score: number;
  options: FeatureOption[];
}

export interface PredictionResult {
  label: "edible" | "poisonous";
  label_id: string;
  confidence: number;
  probabilities: {
    edible: number;
    poisonous: number;
  };
}

export interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface TrainingReport {
  model_comparison: TableData;
  mutual_information: TableData;
  permutation_importance: TableData;
  learning_curve: TableData;
  random_split_20: TableData;
  metadata: Record<string, unknown>;
}

export async function getFeatures(): Promise<Feature[]> {
  const res = await fetch(`${API_URL}/api/features`);
  if (!res.ok) throw new Error("Gagal memuat data fitur");
  return res.json();
}

export async function predict(
  data: Record<string, string>
): Promise<PredictionResult> {
  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.status === 422) {
    const err = await res.json();
    throw new Error(
      err.detail || "Validasi gagal. Periksa kembali input Anda."
    );
  }
  if (!res.ok)
    throw new Error("Gagal menghubungi server. Pastikan backend berjalan.");
  return res.json();
}

export async function getTrainingReport(): Promise<TrainingReport> {
  const res = await fetch(`${API_URL}/api/training-report`);
  if (!res.ok) throw new Error("Gagal memuat laporan pelatihan");
  return res.json();
}

export function getStaticUrl(filename: string): string {
  return `${API_URL}/static/${filename}`;
}
