"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ROLES, ROLE_LABELS, isRole, type Role } from "@/lib/members/roles";
import { categorieFromBirthdate, teamLabel } from "@/lib/teams/constants";
import { createMember, resetMemberCode, deleteMember } from "./actions";

export type MemberRow = {
  id: string;
  prenom: string;
  nom: string;
  roles: string[];
  code_length: number;
  locked_until: string | null;
};

export type TeamOption = {
  id: string;
  categorie: string;
  genre: string;
  nom: string | null;
  gymnase: string | null;
};

export function MembersAdmin({
  initialMembers,
  teams,
}: {
  initialMembers: MemberRow[];
  teams: TeamOption[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [revealedCode, setRevealedCode] = useState<{ for: string; code: string } | null>(
    null
  );

  return (
    <div className="mt-6 flex flex-col gap-8">
      <CreateMemberForm
        teams={teams}
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

type StaffTeamSelection = { teamId: string; role: "entraineur" | "coach" };

function CreateMemberForm({
  teams,
  onCreated,
}: {
  teams: TeamOption[];
  onCreated: (member: MemberRow, code: string) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [dateNaissance, setDateNaissance] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teamTouched, setTeamTouched] = useState(false);
  const [staffTeams, setStaffTeams] = useState<StaffTeamSelection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isJoueur = roles.includes("joueur");
  const staffRoles = roles.filter((r): r is "entraineur" | "coach" => r === "entraineur" || r === "coach");
  const isStaff = staffRoles.length > 0;

  const suggestedCategorie = dateNaissance ? categorieFromBirthdate(dateNaissance) : null;
  const sortedTeams = suggestedCategorie
    ? [
        ...teams.filter((t) => t.categorie === suggestedCategorie),
        ...teams.filter((t) => t.categorie !== suggestedCategorie),
      ]
    : teams;

  function toggleRole(role: Role) {
    setRoles((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      if ((role === "entraineur" || role === "coach") && !next.includes(role)) {
        setStaffTeams((rows) => rows.filter((r) => r.role !== role));
      }
      return next;
    });
  }

  function handleDateNaissance(value: string) {
    setDateNaissance(value);
    if (!teamTouched && value) {
      const categorie = categorieFromBirthdate(value);
      const match = teams.find((t) => t.categorie === categorie);
      if (match) setTeamId(match.id);
    }
  }

  function addStaffTeamRow() {
    const defaultRole = staffRoles[0] ?? "entraineur";
    setStaffTeams((prev) => [...prev, { teamId: teams[0]?.id ?? "", role: defaultRole }]);
  }

  function updateStaffTeamRow(index: number, patch: Partial<StaffTeamSelection>) {
    setStaffTeams((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeStaffTeamRow(index: number) {
    setStaffTeams((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createMember({
        prenom,
        nom,
        roles,
        dateNaissance: isJoueur && dateNaissance ? dateNaissance : null,
        teamId: isJoueur && teamId ? teamId : null,
        staffTeams: isStaff ? staffTeams.filter((s) => s.teamId) : [],
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(
        {
          id: result.id,
          prenom,
          nom,
          roles,
          code_length: result.codeLength,
          locked_until: null,
        },
        result.code
      );
      setPrenom("");
      setNom("");
      setRoles([]);
      setDateNaissance("");
      setTeamId("");
      setTeamTouched(false);
      setStaffTeams([]);
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
          className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
          required
        />
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom"
          className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3"
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

      {isJoueur && (
        <div className="flex flex-col gap-3 rounded-xl bg-background p-4">
          <div>
            <label className="text-sm font-medium text-anthracite">Date de naissance</label>
            <input
              type="date"
              value={dateNaissance}
              onChange={(e) => handleDateNaissance(e.target.value)}
              className="mt-1 h-12 w-full rounded-lg border border-anthracite/20 px-3"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-anthracite">Équipe</label>
            <select
              value={teamId}
              onChange={(e) => {
                setTeamTouched(true);
                setTeamId(e.target.value);
              }}
              className="mt-1 h-12 w-full rounded-lg border border-anthracite/20 px-3 bg-card"
            >
              <option value="">Aucune équipe</option>
              {sortedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {teamLabel(t)}
                  {suggestedCategorie === t.categorie ? " (catégorie proposée)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isStaff && (
        <div className="flex flex-col gap-3 rounded-xl bg-background p-4">
          <label className="text-sm font-medium text-anthracite">Équipes encadrées</label>
          {staffTeams.map((row, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={row.teamId}
                onChange={(e) => updateStaffTeamRow(index, { teamId: e.target.value })}
                className="h-12 min-w-0 flex-1 rounded-lg border border-anthracite/20 px-3 bg-card"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {teamLabel(t)}
                  </option>
                ))}
              </select>
              <select
                value={row.role}
                onChange={(e) =>
                  updateStaffTeamRow(index, { role: e.target.value as "entraineur" | "coach" })
                }
                className="h-12 w-28 shrink-0 rounded-lg border border-anthracite/20 px-3 bg-card"
              >
                {staffRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeStaffTeamRow(index)}
                aria-label="Retirer cette équipe"
                className="h-12 w-12 shrink-0 rounded-lg border border-anthracite/20 text-anthracite/60"
              >
                ×
              </button>
            </div>
          ))}
          {teams.length > 0 && (
            <button
              type="button"
              onClick={addStaffTeamRow}
              className="h-11 rounded-lg border border-anthracite/20 text-sm font-medium text-anthracite"
            >
              + Ajouter une équipe
            </button>
          )}
        </div>
      )}

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
        <Link
          href={`/admin/membres/${member.id}`}
          className="flex h-10 items-center rounded-lg border border-anthracite/20 px-3 text-sm font-medium text-anthracite"
        >
          Gérer les accès
        </Link>
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
