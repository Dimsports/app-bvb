"use client";

import { useState, useTransition } from "react";
import { ROLES, ROLE_LABELS, isRole, type Role } from "@/lib/members/roles";
import { createMember, resetMemberCode, deleteMember } from "./actions";

export type MemberRow = {
  id: string;
  prenom: string;
  nom: string;
  roles: string[];
  code_length: number;
  locked_until: string | null;
};

export function MembersAdmin({ initialMembers }: { initialMembers: MemberRow[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [revealedCode, setRevealedCode] = useState<{ for: string; code: string } | null>(
    null
  );

  return (
    <div className="mt-6 flex flex-col gap-8">
      <CreateMemberForm
        onCreated={(member, code) => {
          setMembers((prev) => [...prev, member].sort((a, b) => a.nom.localeCompare(b.nom)));
          setRevealedCode({ for: `${member.prenom} ${member.nom}`, code });
        }}
      />

      {revealedCode && (
        <div className="rounded-xl border-2 border-turquoise bg-turquoise/10 p-4">
          <p className="text-sm text-anthracite">
            Code pour <strong>{revealedCode.for}</strong> — à noter maintenant, il ne sera
            plus affiché :
          </p>
          <p className="mt-2 font-title text-3xl tracking-widest text-turquoise-contrast">
            {revealedCode.code}
          </p>
          <button
            type="button"
            onClick={() => setRevealedCode(null)}
            className="mt-2 text-sm text-anthracite/60 underline"
          >
            Fermer
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onCodeReset={(code) =>
              setRevealedCode({ for: `${member.prenom} ${member.nom}`, code })
            }
            onDeleted={() =>
              setMembers((prev) => prev.filter((m) => m.id !== member.id))
            }
          />
        ))}
        {members.length === 0 && (
          <p className="text-sm text-anthracite/60">Aucun membre pour l&apos;instant.</p>
        )}
      </ul>
    </div>
  );
}

function CreateMemberForm({
  onCreated,
}: {
  onCreated: (member: MemberRow, code: string) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createMember({ prenom, nom, roles });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(
        { id: crypto.randomUUID(), prenom, nom, roles, code_length: result.codeLength, locked_until: null },
        result.code
      );
      setPrenom("");
      setNom("");
      setRoles([]);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm"
    >
      <h2 className="font-title text-xl text-anthracite">Nouveau membre</h2>

      <div className="flex gap-3">
        <input
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Prénom"
          className="h-12 flex-1 rounded-lg border border-anthracite/20 px-3"
          required
        />
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom"
          className="h-12 flex-1 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            type="button"
            key={role}
            onClick={() => toggleRole(role)}
            className={`h-11 rounded-full border px-4 text-sm font-medium transition ${
              roles.includes(role)
                ? "border-turquoise bg-turquoise text-white"
                : "border-anthracite/20 text-anthracite"
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer le membre"}
      </button>
    </form>
  );
}

function MemberCard({
  member,
  onCodeReset,
  onDeleted,
}: {
  member: MemberRow;
  onCodeReset: (code: string) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const locked = member.locked_until && new Date(member.locked_until) > new Date();

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-anthracite">
          {member.prenom} {member.nom}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {member.roles.filter(isRole).map((role) => (
            <span
              key={role}
              className="rounded-full bg-anthracite/10 px-2 py-0.5 text-xs text-anthracite/70"
            >
              {ROLE_LABELS[role]}
            </span>
          ))}
          {locked && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
              Bloqué
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await resetMemberCode(member.id);
              if (result.ok) onCodeReset(result.code);
            })
          }
          className="h-10 rounded-lg border border-anthracite/20 px-3 text-sm font-medium text-anthracite"
        >
          Réinitialiser le code
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Supprimer ${member.prenom} ${member.nom} ?`)) return;
            startTransition(async () => {
              const result = await deleteMember(member.id);
              if (result.ok) onDeleted();
            });
          }}
          className="h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700"
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}
