import { requireSession } from "@/lib/auth/guard";
import { getMemberById } from "@/lib/members/get-member";
import { ROLE_LABELS, isRole } from "@/lib/members/roles";
import { logoutAction } from "@/lib/auth/actions";
import Link from "next/link";

export default async function AccueilPage() {
  const session = await requireSession();
  const member = await getMemberById(session.memberId);

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-anthracite/60">Bonjour</p>
          <h1 className="font-title text-2xl text-anthracite">
            {member ? `${member.prenom} ${member.nom}` : "…"}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="h-11 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        {member?.roles.filter(isRole).map((role) => (
          <span
            key={role}
            className="rounded-full bg-turquoise/20 px-3 py-1 text-sm font-medium text-turquoise-contrast"
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-anthracite/70">
          Connexion réussie. Les matchs arrivent dans une prochaine étape.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {session.roles.includes("admin") && (
            <>
              <Link
                href="/admin/membres"
                className="inline-flex h-12 items-center rounded-xl bg-anthracite px-5 font-medium text-white"
              >
                Gérer les membres
              </Link>
              <Link
                href="/admin/equipes"
                className="inline-flex h-12 items-center rounded-xl bg-anthracite px-5 font-medium text-white"
              >
                Gérer les équipes
              </Link>
            </>
          )}
          {(session.roles.includes("entraineur") || session.roles.includes("coach")) && (
            <>
              <Link
                href="/equipes"
                className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
              >
                Mes équipes
              </Link>
              <Link
                href="/seances"
                className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
              >
                Séances
              </Link>
              <Link
                href="/bibliotheque"
                className="inline-flex h-12 items-center rounded-xl border border-anthracite/20 px-5 font-medium text-anthracite"
              >
                Bibliothèque d&apos;exercices
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
