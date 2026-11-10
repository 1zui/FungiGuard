"use client";

import { useEffect, useState } from "react";
import type { PredictionResult } from "@/lib/api";

interface Props {
  result: PredictionResult | null;
  loading: boolean;
  error: string | null;
}

function useCountUp(target: number, duration: number = 700) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplayValue(target);
        return;
      }
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // easeOutCubic: 1 - Math.pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(ease * target);
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return displayValue;
}

export function ResultCard({ result, loading, error }: Props) {
  const targetConfidence = result ? result.confidence * 100 : 0;
  const countedConfidence = useCountUp(targetConfidence, 700);

  if (loading) {
    return (
      <div className="border border-warm-border bg-warm-panel rounded-[3px] p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink/70">Menganalisis karakteristik jamur…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-result-danger-border bg-result-danger-bg rounded-[3px] p-6 animate-result">
        <p className="text-sm font-semibold text-result-danger">Terjadi kesalahan</p>
        <p className="mt-1 text-sm text-ink/75 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="border border-warm-border bg-warm-panel rounded-[3px] p-6">
        <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-2">
          Panel Hasil
        </p>
        <p className="text-sm text-ink/50 leading-relaxed">
          Hasil analisis akan muncul di sini setelah Anda mengisi ke-10 karakteristik
          dan menekan tombol <strong>Analisis</strong>.
        </p>
      </div>
    );
  }

  const isEdible = result.label === "edible";
  const ediblePct = result.probabilities.edible * 100;
  const poisonousPct = result.probabilities.poisonous * 100;

  return (
    <div
      key={`${result.label}-${result.confidence}`}
      className={`border rounded-[3px] p-6 transition-colors duration-300 animate-result shadow-xs ${
        isEdible
          ? "border-accent/40 bg-[#FAF7FD]"
          : "border-result-danger-border bg-result-danger-bg"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
          Hasil Klasifikasi
        </p>
        <span
          className={`text-xs px-2 py-0.5 rounded-[2px] font-medium tabular-nums ${
            isEdible
              ? "bg-accent/15 text-accent"
              : "bg-result-danger/15 text-result-danger"
          }`}
        >
          {countedConfidence.toFixed(1)}% Keyakinan
        </span>
      </div>

      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${
          isEdible ? "text-accent" : "text-result-danger"
        }`}
      >
        {result.label_id}
      </p>

      <p className="mt-1.5 text-xs text-ink/65 leading-relaxed">
        Tingkat kepastian model Random Forest terhadap prediksi ini.
      </p>

      {/* Probability bar */}
      <div className="mt-5 pt-4 border-t border-ink/10">
        <div className="flex justify-between text-xs text-ink/70 font-medium mb-1.5 tabular-nums">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Dapat dimakan: {ediblePct.toFixed(1)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-result-danger" />
            Beracun: {poisonousPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-warm-border/80 overflow-hidden flex">
          <div
            className="bg-accent h-full origin-left animate-bar"
            style={{ width: `${ediblePct}%` }}
          />
          <div
            className="bg-result-danger h-full origin-right animate-bar"
            style={{ width: `${poisonousPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
