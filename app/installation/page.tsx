import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { InstallationForm } from "./installation-form";

export const dynamic = "force-dynamic";

export default async function InstallationPage() {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .contains("roles", ["admin"]);

  if (count && count > 0) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-8">
      <div className="w-full max-w-sm">
        <h1 className="font-title text-2xl text-anthracite">Installation</h1>
        <p className="mt-1 text-sm text-anthracite/60">
          Crée le premier compte administrateur du club.
        </p>
        <div className="mt-6">
          <InstallationForm />
        </div>
      </div>
    </main>
  );
}
