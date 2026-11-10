"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
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

export default function AboutPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      <Reveal>
        <h1 className="text-xl font-semibold text-ink mb-1">
          Tentang FungiGuard
        </h1>
        <p className="text-sm text-ink/60 mb-8">
          Latar belakang, tujuan, dan keterbatasan aplikasi ini.
        </p>
      </Reveal>

      {/* Latar belakang: foto di kiri, teks di kanan */}
      <section className="grid md:grid-cols-12 gap-x-10 gap-y-6 mb-10 items-start">
        <Reveal direction="left" className="md:col-span-5">
          <figure>
            <Image
              src="/about/jamur.jpg"
              alt="Sekelompok jamur tumbuh di atas lumut"
              width={1200}
              height={857}
              priority
              className="w-full h-auto rounded-sm"
            />
            <figcaption className="mt-2 text-xs text-ink/50">
              Jamur tumbuh di batang berlumut.
            </figcaption>
          </figure>
        </Reveal>

        <Reveal direction="right" delay={120} className="md:col-span-7">
          <h2 className="text-base font-semibold text-ink mb-2">
            Latar belakang
          </h2>
          <div className="text-sm text-ink/80 leading-relaxed space-y-2">
            <p>
              FungiGuard dibuat sebagai proyek edukasi untuk menunjukkan
              bagaimana machine learning dapat diterapkan pada masalah
              klasifikasi berbasis data kategorikal. Dataset yang digunakan
              adalah UCI Mushroom Dataset (ID 73), kumpulan data klasik yang
              berisi deskripsi 8.124 sampel jamur dari Amerika Utara.
            </p>
            <p>
              Proyek ini menggabungkan seluruh alur kerja data science: mulai
              dari eksplorasi data, pembersihan, seleksi fitur, pelatihan dan
              evaluasi model, hingga deployment sebagai web application.
            </p>
          </div>
        </Reveal>
      </section>

      <div className="max-w-3xl space-y-8">
        {/* Purpose */}
        <Reveal>
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">Tujuan</h2>
            <div className="text-sm text-ink/80 leading-relaxed space-y-2">
              <p>
                Tujuan utama FungiGuard adalah edukasi tentang penerapan machine
                learning pada klasifikasi, bukan alat keselamatan pangan.
                Aplikasi ini memperlihatkan bagaimana model bekerja, fitur apa
                yang paling berpengaruh, dan bagaimana membaca hasil prediksi
                dengan kritis.
              </p>
              <p>
                FungiGuard tidak dimaksudkan untuk menggantikan identifikasi
                ahli mikologi atau panduan lapangan.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Dataset & Method */}
        <Reveal>
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">
              Dataset dan metode
            </h2>
            <div className="text-sm text-ink/80 leading-relaxed space-y-2">
              <p>
                Dataset UCI Mushroom berisi 22 fitur kategorikal yang
                mendeskripsikan karakteristik fisik jamur (bau, warna insang,
                tekstur batang, dll.). Target: edible (dapat dimakan) atau
                poisonous (beracun).
              </p>
              <p>
                Model yang digunakan adalah Random Forest dengan 100 pohon
                keputusan, dilatih pada 10 fitur terpilih berdasarkan skor
                Mutual Information. Pipeline lengkap: imputasi modus → one-hot
                encoding → Random Forest.
              </p>
              <p>
                Evaluasi pada data testing (1.625 sampel) menghasilkan akurasi
                100% dan ROC-AUC 1,0. Hasil ini divalidasi dengan 20 random
                split berbeda, semuanya konsisten.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Limitations */}
        <Reveal>
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">
              Keterbatasan
            </h2>
            <ul className="text-sm text-ink/80 leading-relaxed space-y-2 list-disc list-inside">
              <li>
                Data hanya berasal dari spesies jamur Amerika Utara. Model tidak
                memiliki pengetahuan tentang jamur dari wilayah lain.
              </li>
              <li>
                Model tidak pernah divalidasi di lapangan. Akurasi 100% hanya
                berlaku pada dataset UCI Mushroom, bukan pada jamur di dunia
                nyata.
              </li>
              <li>
                Hanya 10 dari 21 fitur yang digunakan. Informasi dari 11 fitur
                lainnya tidak dipertimbangkan oleh model.
              </li>
              <li>
                Akurasi sempurna ini mencerminkan sifat dataset yang hampir
                deterministik, bukan kemampuan generalisasi model ke data baru.
              </li>
            </ul>
          </section>
        </Reveal>

        {/* Team */}
        <Reveal>
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">Tim</h2>
            <p className="text-sm text-ink/80 leading-relaxed">
              Dikembangkan sebagai proyek edukasi. Kontak:
              fungiguard@example.com
            </p>
          </section>
        </Reveal>

        {/* Tech */}
        <Reveal>
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">Teknologi</h2>
            <div className="text-sm text-ink/80 leading-relaxed space-y-1">
              <p>
                <strong>Backend:</strong> Python, FastAPI, scikit-learn 1.6.1,
                pandas
              </p>
              <p>
                <strong>Frontend:</strong> Next.js (App Router), TypeScript,
                Tailwind CSS
              </p>
              <p>
                <strong>Model:</strong> Random Forest (100 pohon) via
                scikit-learn Pipeline
              </p>
              <p>
                <strong>Dataset:</strong>{" "}
                <a
                  href="https://archive.ics.uci.edu/dataset/73/mushroom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-colors duration-150"
                >
                  UCI Mushroom Dataset (ID 73)
                </a>
              </p>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
