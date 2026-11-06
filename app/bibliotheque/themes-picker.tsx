"use client";

import type { ThemeFamily } from "@/lib/themes/queries";

export function ThemesPicker({
  families,
  selected,
  onChange,
}: {
  families: ThemeFamily[];
  selected: string[];
  onChange: (themeIds: string[]) => void;
}) {
  function toggle(themeId: string) {
    onChange(
      selected.includes(themeId) ? selected.filter((id) => id !== themeId) : [...selected, themeId]
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {families.map((family) => (
        <div key={family.id}>
          <p className="text-sm font-medium text-anthracite/70">{family.nom}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {family.themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => toggle(theme.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected.includes(theme.id)
                    ? "border-turquoise bg-turquoise text-white"
                    : "border-anthracite/20 text-anthracite"
                }`}
              >
                {theme.nom}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
