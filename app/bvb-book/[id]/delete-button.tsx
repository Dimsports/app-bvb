"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCompetence } from "../actions";

export function DeleteButton({ competenceId }: { competenceId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Supprimer cette compétence ?")) return;
    startTransition(async () => {
      const result = await deleteCompetence(competenceId);
      if (result.ok) {
        router.push("/bvb-book");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="h-12 rounded-xl border border-red-200 font-medium text-red-700"
    >
      Supprimer la compétence
    </button>
  );
}
