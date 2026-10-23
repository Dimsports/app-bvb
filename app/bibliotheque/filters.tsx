"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PARTIES, PARTIE_LABELS } from "@/lib/exercises/constants";

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partie = searchParams.get("partie") ?? "";
  const q = searchParams.get("q") ?? "";

  function update(next: { partie?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { partie, q, ...next };
    if (merged.partie) params.set("partie", merged.partie);
    else params.delete("partie");
    if (merged.q) params.set("q", merged.q);
    else params.delete("q");
    router.push(`/bibliotheque?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        defaultValue={q}
        onChange={(e) => update({ q: e.target.value })}
        placeholder="Rechercher un exercice…"
        className="h-12 flex-1 rounded-lg border border-anthracite/20 px-3"
      />
      <select
        value={partie}
        onChange={(e) => update({ partie: e.target.value })}
        className="h-12 rounded-lg border border-anthracite/20 px-3"
      >
        <option value="">Toutes les parties</option>
        {PARTIES.map((p) => (
          <option key={p} value={p}>
            {PARTIE_LABELS[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
