"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchMembers, type MemberSearchResult } from "./actions";

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchMembers(trimmedQuery);
        setResults(data);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [trimmedQuery]);

  const visibleResults = trimmedQuery.length < 2 ? [] : results;

  return (
    <div className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted-dark">Prénom et nom</span>
        <input
          autoFocus
          type="text"
          inputMode="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex. Léo Martin"
          className="h-14 w-full rounded-2xl border border-border-dark bg-anthracite-light px-4 text-lg text-white outline-none placeholder:text-muted-dark focus:border-turquoise"
        />
      </label>

      <div className="flex min-h-[3rem] flex-col gap-2">
        {isPending && <p className="text-sm text-muted-dark">Recherche…</p>}
        {!isPending && trimmedQuery.length >= 2 && visibleResults.length === 0 && (
          <p className="text-sm text-muted-dark">Aucun membre trouvé.</p>
        )}
        {visibleResults.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => router.push(`/connexion/${member.id}`)}
            className="flex h-14 w-full items-center rounded-2xl border border-border-dark bg-anthracite-light px-4 text-left text-lg font-medium text-white transition active:border-turquoise"
          >
            {member.prenom} {member.nom}
          </button>
        ))}
      </div>
    </div>
  );
}
