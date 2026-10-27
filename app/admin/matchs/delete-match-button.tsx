"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatch } from "./actions";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Supprimer ce match ?")) return;
    startTransition(async () => {
      const result = await deleteMatch(matchId);
      if (result.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="shrink-0 text-sm font-medium text-red-700"
    >
      Supprimer
    </button>
  );
}
