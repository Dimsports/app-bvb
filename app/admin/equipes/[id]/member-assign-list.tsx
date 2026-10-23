"use client";

import { useEffect, useState, useTransition } from "react";
import type { TeamMember } from "@/lib/teams/queries";
import { ROLE_LABELS, isRole } from "@/lib/members/roles";
import type { CandidateResult } from "../actions";

type Action<A extends unknown[], R> = (...args: A) => Promise<R>;

export function MemberAssignList({
  teamId,
  title,
  emptyLabel,
  members,
  searchAction,
  addAction,
  removeAction,
}: {
  teamId: string;
  title: string;
  emptyLabel: string;
  members: TeamMember[];
  searchAction: Action<[string, string], CandidateResult[]>;
  addAction: Action<[string, string], { ok: boolean }>;
  removeAction: Action<[string, string], { ok: boolean }>;
}) {
  const [list, setList] = useState(members);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchAction(teamId, trimmed));
      });
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, teamId]);

  const visibleResults = trimmed.length < 2 ? [] : results;

  function handleAdd(candidate: CandidateResult) {
    startTransition(async () => {
      const result = await addAction(teamId, candidate.id);
      if (result.ok) {
        setList((prev) => [...prev, { ...candidate, roles: [] }].sort((a, b) => a.nom.localeCompare(b.nom)));
        setResults((prev) => prev.filter((c) => c.id !== candidate.id));
        setQuery("");
      }
    });
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const result = await removeAction(teamId, memberId);
      if (result.ok) {
        setList((prev) => prev.filter((m) => m.id !== memberId));
      }
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl text-anthracite">{title}</h2>
        <span className="text-sm text-anthracite/60">{list.length}</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {list.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-lg bg-anthracite/5 px-3 py-2"
          >
            <div>
              <span className="text-sm font-medium text-anthracite">
                {member.prenom} {member.nom}
              </span>
              {member.roles.length > 0 && (
                <span className="ml-2 text-xs text-anthracite/50">
                  {member.roles.filter(isRole).map((r) => ROLE_LABELS[r]).join(" · ")}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemove(member.id)}
              className="text-sm font-medium text-red-700"
            >
              Retirer
            </button>
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-anthracite/50">{emptyLabel}</p>}
      </ul>

      <div className="mt-4 flex flex-col gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ajouter par prénom ou nom…"
          className="h-11 rounded-lg border border-anthracite/20 px-3 text-sm"
        />
        {visibleResults.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => handleAdd(candidate)}
            className="flex h-11 items-center rounded-lg border border-turquoise/40 px-3 text-left text-sm font-medium text-turquoise-contrast"
          >
            + {candidate.prenom} {candidate.nom}
          </button>
        ))}
      </div>
    </section>
  );
}
