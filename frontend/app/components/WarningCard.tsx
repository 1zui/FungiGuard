interface Props {
  isEdible: boolean | null;
}

export function WarningCard({ isEdible }: Props) {
  return (
    <div className="border border-warm-border bg-warm-panel rounded-[3px] p-5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-result-danger/80" />
        <p className="text-xs font-semibold text-ink/75 uppercase tracking-wider">
          Pengingat & Peringatan
        </p>
      </div>
      <p className="text-xs text-ink/80 leading-relaxed">
        Jangan mengonsumsi jamur liar berdasarkan hasil prediksi ini. Model dilatih
        pada spesies jamur Amerika Utara dan hanya alat bantu belajar, bukan validasi
        lapangan.
      </p>
      {isEdible === true && (
        <div className="mt-2.5 pt-2 border-t border-ink/10">
          <p className="text-xs text-ink/80 font-medium leading-relaxed">
            Meskipun model memprediksi &ldquo;Dapat dimakan&rdquo;, hasil ini{" "}
            <strong>tidak menjamin keamanan</strong> jamur liar untuk dikonsumsi.
          </p>
        </div>
      )}
    </div>
  );
}
