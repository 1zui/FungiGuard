"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { getTrainingReport, getStaticUrl } from "@/lib/api";
import type { TrainingReport, TableData } from "@/lib/api";

function CountUpNumber({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    let animId: number;
    const duration = 750;

    const step = (timestamp: number) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setValue(target);
        return;
      }
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(ease * target);
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [started, target]);

  const formatted = Math.round(value).toLocaleString("id-ID");
  return (
    <span ref={ref} className="font-semibold tabular-nums text-accent">
      {formatted}
      {suffix}
    </span>
  );
}

function DataTable({ data }: { data?: TableData }) {
  if (!data || !data.columns || !data.rows) return null;

  return (
    <div className="overflow-x-auto w-full max-w-full border border-warm-border rounded-[3px] my-4 bg-white shadow-2xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-warm-panel border-b border-warm-border">
            {data.columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors duration-150 hover:bg-[#FAF7FD] animate-row-enter ${
                i % 2 === 0 ? "bg-white" : "bg-warm-panel/40"
              }`}
              style={{
                animationDelay: `${Math.min(i * 35, 400)}ms`,
                animationFillMode: "both",
              }}
            >
              {data.columns.map((col) => (
                <td
                  key={col}
                  className="px-3 py-2 whitespace-nowrap text-ink/80"
                >
                  {String(row[col] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaticImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-5">
      <div className="border border-warm-border rounded-[3px] overflow-hidden bg-white shadow-2xs">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={450}
          unoptimized
          className="w-full h-auto block"
        />
      </div>
      <figcaption className="mt-2 text-xs text-ink/50 text-center">
        {alt}
      </figcaption>
    </figure>
  );
}

interface StepProps {
  number: number;
  title: string;
  isReached: boolean;
  isCurrent: boolean;
  dotRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}

function Step({
  number,
  title,
  isReached,
  isCurrent,
  dotRef,
  children,
}: StepProps) {
  return (
    <div className="relative pl-12 pb-10 last:pb-2 group">
      {/* Lingkaran angka: abu -> ungu saat dilewati garis, membesar saat aktif */}
      <div
        ref={dotRef}
        className={`absolute left-0 top-0.5 -translate-x-1/2 w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-300 ease-out motion-reduce:transition-none z-10 ${
          isCurrent
            ? "scale-125 bg-accent text-white ring-4 ring-accent/20"
            : isReached
              ? "scale-100 bg-accent text-white shadow-xs"
              : "scale-[0.85] bg-warm-panel text-ink/50 border border-warm-border"
        }`}
      >
        {number}
      </div>

      {/* Isi tahap: tahap aktif menonjol, yang belum dicapai sedikit redup */}
      <div
        className={`transition-all duration-500 ease-out motion-reduce:transition-none ${
          isCurrent
            ? "translate-x-1 opacity-100"
            : isReached
              ? "translate-x-0 opacity-100"
              : "translate-x-0 opacity-70"
        }`}
      >
        <h3
          className={`text-base font-semibold mb-2 transition-colors duration-300 ${
            isCurrent ? "text-accent" : isReached ? "text-ink" : "text-ink/75"
          }`}
        >
          {title}
        </h3>
        <div className="text-sm text-ink/80 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [report, setReport] = useState<TrainingReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reached, setReached] = useState(0); // jumlah lingkaran yang sudah dilewati garis
  const timelineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    getTrainingReport()
      .then(setReport)
      .catch(() => setError("Gagal memuat data laporan pelatihan."));
  }, []);

  const updateScrollProgress = useCallback(() => {
    const el = timelineRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const refY = window.innerHeight * 0.6;

    // Garis dasar/progress dimulai 12px dari atas dan berhenti 12px dari bawah
    const trackHeight = rect.height - 24;
    if (trackHeight <= 0) return;

    const progress = Math.max(
      0,
      Math.min(1, (refY - rect.top - 12) / trackHeight),
    );
    setScrollProgress(progress);

    let count = 0;
    dotRefs.current.forEach((dot, i) => {
      if (!dot) return;
      const b = dot.getBoundingClientRect();
      if (b.top + b.height / 2 <= refY) count = i + 1;
    });
    setReached(count);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        updateScrollProgress();
        rafIdRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Hitung ulang jika tinggi timeline berubah (gambar/tabel selesai dimuat)
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleScroll)
        : null;
    if (resizeObserver && timelineRef.current) {
      resizeObserver.observe(timelineRef.current);
    }

    updateScrollProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      resizeObserver?.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    // `report` ikut sebagai dependency supaya listener terpasang setelah timeline tampil
  }, [updateScrollProgress, report]);

  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        <div className="border border-result-danger-border bg-result-danger-bg rounded-[3px] p-6 animate-page">
          <p className="text-sm font-semibold text-result-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink/60">Memuat laporan pelatihan…</p>
        </div>
      </div>
    );
  }

  const sp = (n: number) => ({
    number: n,
    isReached: n <= reached,
    isCurrent: n === reached,
    dotRef: (el: HTMLDivElement | null) => {
      // eslint-disable-next-line react-hooks/refs
      dotRefs.current[n - 1] = el;
    },
  });

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 animate-page">
      <h1 className="text-xl font-bold text-ink tracking-tight mb-1">
        Bagaimana Model Dilatih
      </h1>
      <p className="text-sm text-ink/60 mb-8">
        Alur lengkap pelatihan model FungiGuard, dari pemuatan data hingga
        ekspor model akhir.
      </p>

      {/* Timeline wrapper with flowing purple progress line */}
      <div ref={timelineRef} className="relative max-w-3xl ml-3 sm:ml-4">
        {/* Continuous background track line */}
        <div className="absolute left-0 top-3 bottom-3 w-[2px] -translate-x-1/2 bg-warm-border" />

        {/* Dynamic flowing purple progress line */}
        <div
          className="absolute left-0 top-3 w-[2px] -translate-x-1/2 bg-accent origin-top transition-transform duration-75 ease-out pointer-events-none"
          style={{
            height: "calc(100% - 24px)",
            transform: `scaleY(${scrollProgress})`,
          }}
        />

        {/* Step 1 */}
        <Step {...sp(1)} title="Pemuatan data">
          <p>
            Dataset diambil dari UCI Machine Learning Repository: Mushroom
            Dataset (ID 73). Dataset berisi <CountUpNumber target={8124} />{" "}
            baris dan 22 fitur kategorikal. Distribusi target: Edible 4.208
            sampel (51,8%), Poisonous 3.916 sampel (48,2%).
          </p>
          <StaticImage
            src={getStaticUrl("distribusi_target.png")}
            alt="Distribusi kelas target (Edible vs Poisonous)"
          />
        </Step>

        {/* Step 2 */}
        <Step {...sp(2)} title="Pemeriksaan dan pembersihan">
          <p>
            Duplikat: 0 baris duplikat ditemukan. Missing value: hanya fitur{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              stalk-root
            </code>{" "}
            yang memiliki nilai hilang, sebanyak 2.480 baris (sekitar 30,5%)
            yang dikodekan sebagai &quot;?&quot;. Fitur{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              veil-type
            </code>{" "}
            hanya memiliki satu nilai unik (&quot;p&quot;) sehingga dibuang.
            Sisa: 21 fitur.
          </p>
        </Step>

        {/* Step 3 */}
        <Step {...sp(3)} title="Pembagian data">
          <p>
            Data dibagi 80:20 secara stratified dengan{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              random_state=42
            </code>
            . Training: <CountUpNumber target={6499} /> sampel (Edible 3.366,
            Poisonous 3.133). Testing: <CountUpNumber target={1625} /> sampel
            (Edible 842, Poisonous 783).
          </p>
        </Step>

        {/* Step 4 */}
        <Step {...sp(4)} title="Imputasi dan seleksi fitur">
          <p>
            Nilai hilang pada{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              stalk-root
            </code>{" "}
            diimputasi dengan modus dari data training. Seleksi fitur
            menggunakan Mutual Information: 10 fitur terbaik dipilih dari 21
            fitur yang tersedia.
          </p>
          <StaticImage
            src={getStaticUrl("mutual_information.png")}
            alt="Skor Mutual Information untuk semua fitur"
          />
          <DataTable data={report.mutual_information} />
        </Step>

        {/* Step 5 */}
        <Step {...sp(5)} title="Perbandingan model">
          <p>
            Tiga model dibandingkan menggunakan Repeated Stratified 5-Fold
            Cross-Validation (3 ulangan, total 15 fold) pada data training.
            Random Forest dan Decision Tree mencapai akurasi sempurna, sementara
            Logistic Regression sedikit lebih rendah. Random Forest dipilih
            karena lebih stabil terhadap variasi data dibandingkan Decision Tree
            tunggal.
          </p>
          <DataTable data={report.model_comparison} />
        </Step>

        {/* Step 6 */}
        <Step {...sp(6)} title="Model final">
          <p>
            Pipeline akhir: SimpleImputer (strategi modus) → OneHotEncoder
            (handle_unknown=&quot;ignore&quot;) → RandomForestClassifier (100
            pohon,{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              random_state=42
            </code>
            ). OneHotEncoder mengubah 10 fitur kategorikal menjadi 69 fitur
            biner.
          </p>
        </Step>

        {/* Step 7 */}
        <Step {...sp(7)} title="Evaluasi">
          <p>
            Pada data testing (1.625 sampel): akurasi{" "}
            <CountUpNumber target={100} suffix="%" />, ROC-AUC 1,0. Confusion
            matrix: TN 842, FP 0, FN 0, TP 783. Tidak ada jamur beracun yang
            lolos diprediksi sebagai edible.
          </p>
          <StaticImage
            src={getStaticUrl("confusion_matrix.png")}
            alt="Confusion matrix pada data testing"
          />
        </Step>

        {/* Step 8 */}
        <Step {...sp(8)} title="Permutation importance">
          <p>
            Permutation importance diukur pada data testing (10 ulangan). Fitur{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              odor
            </code>{" "}
            mendominasi: saat nilainya diacak, akurasi turun paling besar.
            Beberapa fitur menunjukkan importance nol secara individual karena
            redundansi informasi antar fitur di dalam ensemble.
          </p>
          <StaticImage
            src={getStaticUrl("permutation_importance.png")}
            alt="Permutation importance 10 fitur terpilih"
          />
          <DataTable data={report.permutation_importance} />
        </Step>

        {/* Step 9 */}
        <Step {...sp(9)} title="Uji ketahanan">
          <p>
            20 random split (seed 0–19) diuji. Setiap split menghitung ulang
            seleksi fitur dari data training-nya. Semua split menghasilkan
            akurasi 100% dengan 0 jamur beracun yang lolos diprediksi edible.
          </p>
          <DataTable data={report.random_split_20} />
          <StaticImage
            src={getStaticUrl("learning_curve.png")}
            alt="Learning curve: akurasi vs jumlah data training"
          />
          <DataTable data={report.learning_curve} />
        </Step>

        {/* Step 10 */}
        <Step {...sp(10)} title="Investigasi struktur dataset">
          <p>
            Analisis lebih lanjut menunjukkan mengapa akurasi 100% tercapai.
            Decision Tree dengan kedalaman maksimal 5 mencapai akurasi 100%
            hanya dengan 9 daun. Klasifikasi berdasarkan{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              odor
            </code>{" "}
            saja menghasilkan akurasi 98,58%. Dari 8.124 sampel, 10 fitur
            terpilih membentuk 531 kombinasi unik, dan tidak ada satu pun
            kombinasi yang memiliki label kelas yang bertentangan. Dataset ini
            bersifat deterministik secara kategorikal.
          </p>
        </Step>

        {/* Step 11 */}
        <Step {...sp(11)} title="Ekspor model">
          <p>
            Pipeline lengkap (Imputer → OneHotEncoder → RandomForestClassifier)
            disimpan sebagai file{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              fungiguard_final_model.joblib
            </code>
            . Daftar 10 fitur terpilih dan metadata model juga diekspor.
            File-file inilah yang digunakan oleh web ini untuk melakukan
            prediksi.
          </p>
        </Step>
      </div>

      {/* Honest reading section */}
      <div className="max-w-3xl mt-12 border-t border-warm-border pt-8 ml-3 sm:ml-4">
        <h2 className="text-lg font-bold text-ink mb-3">
          Cara membaca hasil ini secara jujur
        </h2>
        <div className="text-sm text-ink/80 leading-relaxed space-y-3">
          <p>
            Akurasi 100% pada model ini mencerminkan karakteristik dataset UCI
            Mushroom yang hampir deterministik. Fitur seperti{" "}
            <code className="text-xs bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-medium">
              odor
            </code>{" "}
            sangat menentukan kelas target: bau saja sudah cukup untuk
            mengklasifikasikan 98,58% sampel dengan benar, dan 531 kombinasi
            fitur unik di dataset ini tidak mengandung konflik label.
          </p>
          <p>
            Ini bukan bukti bahwa model akan sempurna di lapangan atau pada
            spesies jamur baru. Dataset ini berasal dari spesies jamur Amerika
            Utara dan terbatas pada 22 fitur deskriptif. Model ini tidak pernah
            divalidasi di lapangan dan tidak boleh digunakan sebagai pengganti
            identifikasi ahli.
          </p>
          <p>
            Evaluasi ini menunjukkan bahwa pipeline machine learning bekerja
            dengan benar pada data yang ada — bukan bahwa masalah klasifikasi
            jamur secara umum sudah &quot;terpecahkan.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
