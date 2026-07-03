import React from "react";
import { Check, Palette } from "lucide-react";
import { APPLE_THEME_ACCENTS, ThemeAccentId, findThemeAccent } from "../lib/theme";

export default function ThemeColorPicker({
  value,
  onChange,
}: {
  value: ThemeAccentId;
  onChange: (accent: ThemeAccentId) => void;
}) {
  const selectedAccent = findThemeAccent(value);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 accent-text" />
            Theme color
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Apple system accent for navigation, primary actions, and focus states.
          </p>
        </div>
        <div className="accent-badge inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider">
          <span className="h-2.5 w-2.5 rounded-full accent-bg" />
          {selectedAccent.name}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2" role="radiogroup" aria-label="Theme color">
        {APPLE_THEME_ACCENTS.map((accent) => {
          const selected = accent.id === value;
          return (
            <button
              key={accent.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${accent.name} theme color`}
              title={accent.name}
              onClick={() => onChange(accent.id)}
              className={`relative h-11 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] ${
                selected ? "border-slate-900 shadow-sm scale-[1.02]" : "border-slate-200 hover:border-slate-400"
              }`}
              style={{ backgroundColor: accent.color }}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm"
                    style={{ backgroundColor: accent.contrast, color: accent.color }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
