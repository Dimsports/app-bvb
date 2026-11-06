"use client";

import { useState, useTransition } from "react";
import type { ClubFeature } from "@/lib/features/constants";
import { MODULE_LABELS } from "@/lib/features/constants";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/members/roles";
import { updateFeature } from "./actions";

function FeatureCard({ feature }: { feature: ClubFeature }) {
  const [enabled, setEnabled] = useState(feature.enabled);
  const [roles, setRoles] = useState<string[]>(feature.roles);
  const [isPending, startTransition] = useTransition();

  function save(nextEnabled: boolean, nextRoles: string[]) {
    startTransition(() => {
      updateFeature(feature.module, { enabled: nextEnabled, roles: nextRoles });
    });
  }

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    save(next, roles);
  }

  function toggleRole(role: Role) {
    const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
    setRoles(next);
    save(enabled, next);
  }

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-anthracite">{MODULE_LABELS[feature.module]}</h2>
        <button
          type="button"
          disabled={isPending}
          onClick={toggleEnabled}
          className={`h-8 w-14 shrink-0 rounded-full transition disabled:opacity-60 ${
            enabled ? "bg-turquoise" : "bg-anthracite/20"
          }`}
          aria-label={enabled ? "Désactiver" : "Activer"}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transition ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              disabled={isPending}
              onClick={() => toggleRole(role)}
              className={`h-9 rounded-full px-3 text-sm font-medium disabled:opacity-60 ${
                roles.includes(role)
                  ? "bg-turquoise text-on-turquoise"
                  : "border border-anthracite/20 text-anthracite/60"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function FeaturesBoard({ initialFeatures }: { initialFeatures: ClubFeature[] }) {
  return (
    <div className="flex flex-col gap-4">
      {initialFeatures.map((f) => (
        <FeatureCard key={f.module} feature={f} />
      ))}
    </div>
  );
}
