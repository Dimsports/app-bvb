"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateExercise } from "../actions";

export function DuplicateButton({ exerciseId }: { exerciseId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await duplicateExercise(exerciseId);
      if (result.ok) router.push(`/bibliotheque/${result.id}`);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
    >
      {isPending ? "Duplication…" : "Dupliquer et adapter"}
    </button>
  );
}
