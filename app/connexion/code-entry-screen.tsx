import Link from "next/link";
import { rolesSummary, initials } from "@/lib/members/roles";
import { Numpad } from "@/app/connexion/numpad";

export function CodeEntryScreen({
  member,
}: {
  member: {
    id: string;
    prenom: string;
    nom: string;
    roles: string[];
    code_length: number;
    locked: boolean;
  };
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-anthracite px-7 py-11 text-white">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center gap-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-bvb.jpeg"
          alt="Logo BVB Le Poiré - Les Lucs"
          className="h-28 w-28 rounded-[28px] bg-white object-contain p-2"
        />

        <div className="flex flex-col items-center gap-1">
          <h1 className="font-title text-[32px] tracking-wide text-white">
            Espace club BVB
          </h1>
          <span className="text-sm text-muted-dark">Le Poiré - Les Lucs</span>
        </div>

        <Link
          href="/connexion?changer=1"
          className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-border-dark bg-anthracite-light px-3.5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-on-turquoise">
            {initials(member.prenom, member.nom)}
          </span>
          <span className="flex flex-1 flex-col items-start">
            <span className="text-[15px] font-semibold">
              {member.prenom} {member.nom}
            </span>
            <span className="text-xs text-muted-dark">{rolesSummary(member.roles)}</span>
          </span>
          <span className="text-[13px] font-semibold text-turquoise">Changer</span>
        </Link>

        <Numpad
          memberId={member.id}
          codeLength={member.code_length as 4 | 6}
          initiallyLocked={member.locked}
        />
      </div>
    </main>
  );
}
