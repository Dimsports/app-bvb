import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getMemberById } from "@/lib/members/get-member";
import { getClubFeatures, getMemberOverrides } from "@/lib/features/queries";
import { ROLE_LABELS, isRole } from "@/lib/members/roles";
import { PageHeader } from "@/components/page-header";
import { MemberAccessBoard } from "./member-access-board";

export default async function MemberAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;

  const member = await getMemberById(id);
  if (!member) notFound();

  const [features, overrides] = await Promise.all([
    getClubFeatures(),
    getMemberOverrides(id),
  ]);

  const isAdmin = member.roles.includes("admin");

  return (
    <main className="flex flex-1 flex-col bg-background px-6 py-8">
      <PageHeader
        title={`${member.prenom} ${member.nom}`}
        subtitle="Accès aux fonctionnalités"
        backHref="/admin/membres"
      />
      <div className="mt-1 flex flex-wrap gap-1">
        {member.roles.filter(isRole).map((role) => (
          <span
            key={role}
            className="rounded-full bg-anthracite/10 px-2 py-0.5 text-xs text-anthracite/70"
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {isAdmin ? (
        <p className="mt-6 text-sm text-anthracite/60">
          Les administrateurs ont toujours accès à toutes les fonctionnalités : les accès
          personnalisés ne s&apos;appliquent pas à ce membre.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-anthracite/60">
            Par défaut, l&apos;accès de ce membre dépend de son rôle et des réglages de
            l&apos;espace Administration. Vous pouvez forcer un accès personnalisé module par
            module, uniquement pour ce membre.
          </p>
          <div className="mt-6">
            <MemberAccessBoard
              memberId={member.id}
              memberRoles={member.roles}
              features={features}
              overrides={overrides}
            />
          </div>
        </>
      )}
    </main>
  );
}
