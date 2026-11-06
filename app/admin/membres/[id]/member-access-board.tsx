"use client";

import { useState, useTransition } from "react";
import type { ClubFeature, Module } from "@/lib/features/constants";
import { MODULE_LABELS } from "@/lib/features/constants";
import { setMemberOverride } from "./actions";

type RowState = {
  module: Module;
  roleAllowed: boolean;
  override: boolean | null;
};

function AccessRow({
  memberId,
  row,
}: {
  memberId: string;
  row: RowState;
}) {
  const [override, setOverride] = useState(row.override);
  const [isPending, startTransition] = useTransition();

  function apply(next: boolean | null) {
    setOverride(next);
    startTransition(() => {
      setMemberOverride(memberId, row.module, next);
    });
  }

  const effectiveAllowed = override === null ? row.roleAllowed : override;

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-anthracite">{MODULE_LABELS[row.module]}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            effectiveAllowed ? "bg-turquoise/15 text-turquoise-contrast" : "bg-anthracite/10 text-anthracite/60"
          }`}
        >
          {effectiveAllowed ? "Autorisé" : "Bloqué"}
        </span>
      </div>
      <p className="mt-1 text-sm text-anthracite/60">
        {override === null
          ? `Par défaut (rôle) — ${row.roleAllowed ? "autorisé" : "bloqué"}`
          : "Accès personnalisé pour ce membre"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => apply(null)}
          className={`h-9 rounded-full px-3 text-sm font-medium disabled:opacity-60 ${
            override === null
              ? "bg-anthracite text-white"
              : "border border-anthracite/20 text-anthracite/60"
          }`}
        >
          Par défaut
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => apply(true)}
          className={`h-9 rounded-full px-3 text-sm font-medium disabled:opacity-60 ${
            override === true
              ? "bg-turquoise text-on-turquoise"
              : "border border-anthracite/20 text-anthracite/60"
          }`}
        >
          Toujours autoriser
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => apply(false)}
          className={`h-9 rounded-full px-3 text-sm font-medium disabled:opacity-60 ${
            override === false
              ? "bg-red-600 text-white"
              : "border border-anthracite/20 text-anthracite/60"
          }`}
        >
          Toujours bloquer
        </button>
      </div>
    </section>
  );
}

export function MemberAccessBoard({
  memberId,
  memberRoles,
  features,
  overrides,
}: {
  memberId: string;
  memberRoles: string[];
  features: ClubFeature[];
  overrides: { module: Module; granted: boolean }[];
}) {
  const overrideByModule = new Map(overrides.map((o) => [o.module, o.granted]));

  const rows: RowState[] = features.map((f) => ({
    module: f.module,
    roleAllowed: f.enabled && f.roles.some((r) => memberRoles.includes(r)),
    override: overrideByModule.has(f.module) ? overrideByModule.get(f.module)! : null,
  }));

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <AccessRow key={row.module} memberId={memberId} row={row} />
      ))}
    </div>
  );
}
