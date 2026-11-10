"use client";

import { useEffect, useState, useCallback } from "react";
import { getFeatures, predict } from "@/lib/api";
import type { Feature, PredictionResult } from "@/lib/api";
import { FeatureSelect } from "./components/FeatureSelect";
import { ResultCard } from "./components/ResultCard";
import { WarningCard } from "./components/WarningCard";
import { HistoryTable, historyStore } from "./components/HistoryTable";
import type { HistoryEntry } from "./components/HistoryTable";

export default function HomePage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  useEffect(() => {
    getFeatures()
      .then(setFeatures)
      .catch(() =>
        setFeaturesError(
          "Gagal memuat data fitur. Pastikan backend berjalan di http://localhost:8000."
        )
      );
  }, []);

  const filledCount = features.filter((f) => Boolean(values[f.key])).length;
  const allFilled = features.length > 0 && filledCount === features.length;

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = () => {
    setValues({});
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!allFilled) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await predict(values);
      setResult(res);

      // Build label lookup for history
      const inputLabels: Record<string, string> = {};
      for (const f of features) {
        const opt = f.options.find((o) => o.value === values[f.key]);
        inputLabels[f.key] = opt ? opt.label : values[f.key];
      }

      const entry: HistoryEntry = {
        id: Date.now(),
        time: new Date().toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        inputs: { ...values },
        inputLabels,
        result: res.label_id,
        confidence: (res.confidence * 100).toFixed(1) + "%",
      };
      historyStore.add(entry);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan yang tidak diketahui."
      );
    } finally {
      setLoading(false);
    }
  };

  const featureKeys = features.map((f) => f.key);
  const featureLabels: Record<string, string> = {};
  for (const f of features) {
    featureLabels[f.key] = f.label;
  }

  if (featuresError) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <div className="border border-result-danger-border bg-result-danger-bg rounded-[3px] p-6 animate-page">
          <p className="text-sm font-semibold text-result-danger">
            Tidak dapat terhubung ke server
          </p>
          <p className="mt-1 text-sm text-ink/75 leading-relaxed">{featuresError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start w-full">
        {/* Left column: Input (min-w-0 to prevent layout stretching) */}
        <div className="min-w-0 w-full animate-page">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h1 className="text-xl font-bold text-ink tracking-tight">
                Klasifikasi Jamur
              </h1>
              <p className="text-sm text-ink/60 mt-0.5">
                Isi 10 karakteristik jamur untuk memprediksi kelayakan konsumsi.
              </p>
            </div>
            {features.length > 0 && (
              <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-[3px] bg-warm-panel border border-warm-border text-ink/70 font-medium transition-colors">
                {filledCount} dari {features.length} terisi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <div
                key={feature.key}
                className="animate-result"
                style={{
                  animationDelay: `${idx * 40}ms`,
                  animationFillMode: "both",
                }}
              >
                <FeatureSelect
                  feature={feature}
                  value={values[feature.key] || ""}
                  onChange={(v) => handleChange(feature.key, v)}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!allFilled || loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-accent rounded-[3px] transition-all duration-200 hover:bg-accent-light active:scale-[0.98] hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer flex items-center gap-2"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{loading ? "Menganalisis…" : "Analisis"}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-medium text-ink/70 border border-warm-border rounded-[3px] transition-all duration-200 hover:text-ink hover:bg-warm-panel active:scale-[0.98] cursor-pointer"
            >
              Reset
            </button>
          </div>

          <HistoryTable
            featureKeys={featureKeys}
            featureLabels={featureLabels}
          />
        </div>

        {/* Right column: Results (sticky on desktop) */}
        <div
          className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-20 space-y-4 animate-page"
          style={{ animationDelay: "120ms", animationFillMode: "both" }}
        >
          <ResultCard result={result} loading={loading} error={error} />
          <WarningCard
            isEdible={result ? result.label === "edible" : null}
          />
        </div>
      </div>
    </div>
  );
}
