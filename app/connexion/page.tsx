import { redirect } from "next/navigation";
import { getSession, getRememberedMemberId } from "@/lib/auth/session";
import { getMemberLoginInfo } from "./actions";
import { CodeEntryScreen } from "./code-entry-screen";
import { SearchScreen } from "./search-screen";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ changer?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/accueil");
  }

  const { changer } = await searchParams;
  const rememberedId = changer ? null : await getRememberedMemberId();
  const member = rememberedId ? await getMemberLoginInfo(rememberedId) : null;

  if (member) {
    return <CodeEntryScreen member={member} />;
  }

  return <SearchScreen />;
}
