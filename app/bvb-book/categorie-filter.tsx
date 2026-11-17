"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CategorieFilter({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorie = searchParams.get("categorie") ?? "";

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("categorie", value);
    else params.delete("categorie");
    router.push(`/bvb-book?${params.toString()}`);
  }

  return (
    <select
      value={categorie}
      onChange={(e) => update(e.target.value)}
      className="h-12 rounded-lg border border-anthracite/20 px-3"
    >
      <option value="">Toutes les catégories</option>
      {categories.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
