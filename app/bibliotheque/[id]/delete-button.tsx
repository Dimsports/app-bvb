"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteExercise } from "../actions";

export function DeleteButton({ exerciseId }: { exerciseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Supprimer cet exercice ?")) return;
    startTransition(async () => {
      const result = await deleteExercise(exerciseId);
      if (result.ok) {
        router.push("/bibliotheque");
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
      Supprimer l&apos;exercice
    </button>
  );
}
