"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { getFeatures } from "@/lib/api";
import type { Feature } from "@/lib/api";

type Direction = "up" | "left" | "right";

function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden =
    direction === "left"
      ? "-translate-x-5"
      : direction === "right"
        ? "translate-x-5"
        : "translate-y-4";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${hidden}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Petunjuk cara mengamati tiap fitur. */
function ObservationTip({ featureKey }: { featureKey: string }) {
  let tip: ReactNode = null;

  if (featureKey === "odor") {
    tip = (
      <>
        potong atau patahkan jamur, lalu cium aromanya. Bau bisa berkisar dari
        almond yang manis hingga bau busuk yang menyengat.
      </>
    );
  } else if (featureKey === "spore-print-color") {
    tip = (
      <>
        letakkan tudung jamur dengan sisi insang menghadap ke bawah di atas
        kertas putih/hitam selama beberapa jam. Warna spora yang jatuh adalah
        cetak spora.
      </>
    );
  } else if (featureKey === "gill-color") {
    tip = (
      <>
        balikkan jamur dan perhatikan warna bilah-bilah tipis (lamela) yang
        memancar dari batang ke tepi tudung.
      </>
    );
  } else if (featureKey === "ring-type") {
    tip = (
      <>
        perhatikan apakah ada struktur seperti gelang yang mengelilingi batang
        jamur, dan bagaimana bentuk serta sifatnya.
      </>
    );
  } else if (
    featureKey === "stalk-surface-above-ring" ||
    featureKey === "stalk-surface-below-ring"
  ) {
    tip = (
      <>
        raba permukaan batang{" "}
        {featureKey.includes("above") ? "di atas" : "di bawah"} cincin untuk
        merasakan teksturnya — apakah berserat, halus seperti sutra, atau
        bersisik.
      </>
    );
  } else if (
    featureKey === "stalk-color-above-ring" ||
    featureKey === "stalk-color-below-ring"
  ) {
    tip = (
      <>
        perhatikan warna batang{" "}
        {featureKey.includes("above") ? "di atas" : "di bawah"} cincin.
      </>
    );
  } else if (featureKey === "gill-size") {
    tip = (
      <>
        perhatikan lebar bilah insang — apakah lebar (broad) atau sempit
        (narrow) relatif terhadap ukuran tudung.
      </>
    );
  } else if (featureKey === "population") {
    tip = (
      <>
        perhatikan bagaimana jamur tumbuh di habitatnya — apakah sendiri
        (soliter), dalam kelompok kecil, atau dalam jumlah banyak.
      </>
    );
  }

  if (!tip) return null;

  return (
    <div className="text-xs text-ink/65 mb-4 p-2.5 bg-warm-panel/60 border-l-2 border-accent rounded-r-[2px] leading-relaxed">
      <p>
        <strong>Cara mengamati:</strong> {tip}
      </p>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFocused(entry.isIntersecting),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`border rounded-[3px] p-5 bg-white transition-all duration-300 motion-reduce:transition-none hover:border-accent/50 ${
        focused
          ? "border-accent/60 shadow-xs -translate-y-0.5"
          : "border-warm-border shadow-none translate-y-0"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-7 h-7 shrink-0 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-300 motion-reduce:transition-none ${
              focused
                ? "scale-110 bg-accent text-white ring-4 ring-accent/20"
                : "scale-100 bg-warm-panel text-ink/50 border border-warm-border"
            }`}
          >
            {index + 1}
          </div>
          <div>
            <h3
              className={`text-sm font-semibold transition-colors duration-300 ${
                focused ? "text-accent" : "text-ink"
              }`}
            >
              {feature.label}
            </h3>
            <p className="text-xs text-ink/50 mt-0.5">
              Kode fitur:{" "}
              <code className="bg-[#F4EFFC] text-accent px-1.5 py-0.5 rounded-[2px] font-mono text-[11px]">
                {feature.key}
              </code>
            </p>
          </div>
        </div>
        <span className="text-xs text-accent font-medium bg-[#F4EFFC] border border-[#E1D4F0] px-2 py-0.5 rounded-[2px] whitespace-nowrap">
          MI:{" "}
          {typeof feature.mi_score === "number"
            ? feature.mi_score.toFixed(4)
            : feature.mi_score}
        </span>
      </div>

      <p className="text-sm text-ink/75 mb-3">{feature.description}</p>

      <ObservationTip featureKey={feature.key} />

      {/* Value table */}
      <div className="overflow-x-auto w-full max-w-full border border-warm-border rounded-[2px]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-warm-panel border-b border-warm-border">
              <th className="px-3 py-1.5 text-left font-semibold text-ink/70">
                Kode UCI
              </th>
              <th className="px-3 py-1.5 text-left font-semibold text-ink/70">
                Label
              </th>
            </tr>
          </thead>
          <tbody>
            {feature.options.map((opt, i) => (
              <tr
                key={opt.value}
                className={`transition-colors duration-150 hover:bg-[#FAF7FD] ${
                  i % 2 === 0 ? "bg-white" : "bg-warm-panel/40"
                }`}
              >
                <td className="px-3 py-1.5 font-mono text-accent font-medium">
                  {opt.value}
                </td>
                <td className="px-3 py-1.5 text-ink/80">{opt.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeatures()
      .then(setFeatures)
      .catch(() => setError("Gagal memuat data fitur."));
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {/* Warning banner */}
      <div className="border border-result-danger-border bg-result-danger-bg rounded-[3px] p-5 mb-8 animate-page">
        <p className="text-sm font-semibold text-result-danger mb-1 flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Peringatan penting</span>
        </p>
        <p className="text-sm text-ink/80 leading-relaxed">
          Model ini dilatih menggunakan data spesies jamur Amerika Utara dari
          UCI Mushroom Dataset. Jangan gunakan untuk mengidentifikasi jamur di
          Indonesia atau wilayah lain. Jangan pernah mengonsumsi jamur liar
          berdasarkan prediksi model ini.
        </p>
      </div>

      <Reveal>
        <h1 className="text-xl font-bold text-ink tracking-tight mb-1">
          Panduan Penggunaan
        </h1>
        <p className="text-sm text-ink/60 mb-8">
          Penjelasan setiap fitur input, cara membaca hasil, dan langkah
          menggunakan aplikasi.
        </p>
      </Reveal>

      {error && (
        <div className="border border-result-danger-border bg-result-danger-bg rounded-[3px] p-4 mb-8">
          <p className="text-sm text-result-danger">{error}</p>
        </div>
      )}

      {/* Feature guide */}
      <section className="mb-12">
        <Reveal>
          <h2 className="text-lg font-bold text-ink mb-2">10 Fitur Input</h2>
          <p className="text-sm text-ink/60 mb-6">
            Model menggunakan 10 fitur yang dipilih berdasarkan skor Mutual
            Information tertinggi dari 21 fitur yang tersedia. Fitur diurutkan
            dari yang paling informatif.
          </p>
        </Reveal>

        <div className="space-y-6">
          {features.map((feature, idx) => (
            <Reveal key={feature.key} delay={Math.min(idx, 2) * 80}>
              <FeatureCard feature={feature} index={idx} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Reading confidence */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-lg font-bold text-ink mb-3">
            Cara Membaca Persentase Keyakinan
          </h2>
          <div className="text-sm text-ink/80 leading-relaxed space-y-3">
            <p>
              Persentase keyakinan yang ditampilkan adalah probabilitas yang
              dihitung oleh model Random Forest, yaitu rata-rata probabilitas
              dari 100 pohon keputusan. Karena pohon dibangun hingga murni,
              angka ini mendekati proporsi pohon yang memilih suatu kelas.
            </p>
            <p>
              Misalnya, keyakinan 97% berarti kurang lebih 97 dari 100 pohon
              memprediksi kelas yang sama. Angka ini bukan jaminan kebenaran —
              model bisa saja salah meskipun keyakinannya tinggi, terutama jika
              input berasal dari spesies yang tidak ada dalam data training.
            </p>
            <p>
              Pada dataset UCI Mushroom, model ini cenderung menghasilkan
              keyakinan yang sangat tinggi (mendekati 100%) karena dataset
              bersifat hampir deterministik.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Usage steps */}
      <Reveal>
        <section>
          <h2 className="text-lg font-bold text-ink mb-3">
            Langkah Menggunakan Aplikasi
          </h2>
          <ol className="text-sm text-ink/80 leading-relaxed space-y-2.5 list-decimal list-inside">
            <li>
              Buka halaman <strong>Home</strong>.
            </li>
            <li>
              Isi ke-10 dropdown fitur dengan karakteristik jamur yang ingin
              Anda klasifikasi. Gunakan panduan fitur di atas untuk memahami
              setiap pilihan.
            </li>
            <li>
              Klik tombol <strong>Analisis</strong>. Tombol ini aktif setelah
              semua fitur terisi.
            </li>
            <li>
              Hasil prediksi muncul di panel kanan: label klasifikasi (Dapat
              dimakan / Beracun), keyakinan model, dan bar probabilitas.
            </li>
            <li>
              Setiap analisis tercatat di tabel riwayat di bawah form. Riwayat
              tersimpan di browser Anda dan bertahan selama Anda tidak
              menghapusnya.
            </li>
            <li>
              Klik <strong>Reset</strong> untuk mengosongkan semua input dan
              memulai analisis baru.
            </li>
          </ol>
        </section>
      </Reveal>
    </div>
  );
}
