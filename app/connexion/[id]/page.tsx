import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMemberLoginInfo } from "../actions";
import { CodeEntryScreen } from "../code-entry-screen";

export default async function ConnexionCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/accueil");
  }

  const { id } = await params;
  const member = await getMemberLoginInfo(id);
  if (!member) {
    notFound();
  }

  return <CodeEntryScreen member={member} />;
}
