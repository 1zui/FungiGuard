import type { Feature } from "@/lib/api";

interface Props {
  feature: Feature;
  value: string;
  onChange: (value: string) => void;
}

export function FeatureSelect({ feature, value, onChange }: Props) {
  const isSelected = Boolean(value);

  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <label
          htmlFor={feature.key}
          className="block text-sm font-medium text-ink transition-colors duration-150 group-hover:text-accent"
        >
          {feature.label}
        </label>
        {isSelected && (
          <span className="text-[10px] text-accent font-medium bg-[#F4EFFC] border border-[#E1D4F0] px-1.5 py-0.2 rounded-[2px] animate-page">
            ✓ Terisi
          </span>
        )}
      </div>
      <p className="text-xs text-ink/50 leading-relaxed">{feature.description}</p>
      <div className="relative">
        <select
          id={feature.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-sm rounded-[3px] px-3 py-2 cursor-pointer transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent/25 focus:scale-[1.003] ${
            isSelected
              ? "border border-accent/50 bg-[#FAF7FD] text-ink font-medium shadow-2xs"
              : "border border-warm-border bg-white text-ink/80 hover:border-warm-border-dark"
          }`}
        >
          <option value="">Pilih…</option>
          {feature.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({opt.value})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
