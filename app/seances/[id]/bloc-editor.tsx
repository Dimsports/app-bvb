"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PARTIE_LABELS, PARTIE_COLOR_VAR, isPartie } from "@/lib/exercises/constants";
import type { SeanceBloc } from "@/lib/seances/queries";
import { removeBloc, updateBlocDuration, reorderBlocs } from "../actions";
import { AddExercisePanel } from "./add-exercise-panel";

function partieColor(partie: string) {
  return isPartie(partie) ? PARTIE_COLOR_VAR[partie] : "var(--color-dot-empty)";
}

function DistributionBar({ blocs }: { blocs: SeanceBloc[] }) {
  const total = blocs.reduce((sum, b) => sum + b.duree_minutes, 0);

  if (total === 0) {
    return <div className="h-2 w-full rounded-full bg-anthracite/10" />;
  }

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full">
      {blocs.map((b) => (
        <div
          key={b.id}
          style={{ width: `${(b.duree_minutes / total) * 100}%`, backgroundColor: partieColor(b.exercice.partie) }}
        />
      ))}
    </div>
  );
}

function BlocRow({
  bloc,
  canEdit,
  onRemove,
  onDurationChange,
}: {
  bloc: SeanceBloc;
  canEdit: boolean;
  onRemove: (id: string) => void;
  onDurationChange: (id: string, minutes: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloc.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm"
    >
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Réordonner"
          className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-anthracite/40 active:cursor-grabbing"
        >
          ⠿
        </button>
      )}
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: partieColor(bloc.exercice.partie) }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-anthracite">{bloc.exercice.titre}</p>
        <p className="text-xs text-anthracite/50">
          {isPartie(bloc.exercice.partie) ? PARTIE_LABELS[bloc.exercice.partie] : bloc.exercice.partie}
        </p>
      </div>
      {canEdit ? (
        <>
          <input
            type="number"
            min={1}
            max={180}
            value={bloc.duree_minutes}
            onChange={(e) => onDurationChange(bloc.id, Number(e.target.value))}
            className="h-10 w-16 rounded-lg border border-anthracite/20 px-2 text-center text-sm"
          />
          <button
            type="button"
            onClick={() => onRemove(bloc.id)}
            className="text-sm font-medium text-red-700"
          >
            Retirer
          </button>
        </>
      ) : (
        <span className="text-sm text-anthracite/60">{bloc.duree_minutes} min</span>
      )}
    </li>
  );
}

export function BlocEditor({
  seanceId,
  canEdit,
  initialBlocs,
}: {
  seanceId: string;
  canEdit: boolean;
  initialBlocs: SeanceBloc[];
}) {
  const [blocs, setBlocs] = useState(initialBlocs);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const total = blocs.reduce((sum, b) => sum + b.duree_minutes, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocs((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(() => {
        reorderBlocs(seanceId, next.map((b) => b.id));
      });
      return next;
    });
  }

  function handleRemove(blocId: string) {
    setBlocs((prev) => prev.filter((b) => b.id !== blocId));
    startTransition(() => {
      removeBloc(seanceId, blocId);
    });
  }

  function handleDurationChange(blocId: string, minutes: number) {
    setBlocs((prev) => prev.map((b) => (b.id === blocId ? { ...b, duree_minutes: minutes } : b)));
    if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 180) {
      startTransition(() => {
        updateBlocDuration(seanceId, blocId, minutes);
      });
    }
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-title text-xl text-anthracite">Déroulé</h2>
        <span className="text-sm text-anthracite/60">{total} min</span>
      </div>

      <div className="mt-3">
        <DistributionBar blocs={blocs} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocs.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-4 flex flex-col gap-2">
            {blocs.map((bloc) => (
              <BlocRow
                key={bloc.id}
                bloc={bloc}
                canEdit={canEdit}
                onRemove={handleRemove}
                onDurationChange={handleDurationChange}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {blocs.length === 0 && (
        <p className="mt-4 text-sm text-anthracite/50">Aucun exercice pour l&apos;instant.</p>
      )}

      {canEdit && (
        <div className="mt-4">
          <AddExercisePanel
            seanceId={seanceId}
            onAdded={(bloc) => setBlocs((prev) => [...prev, bloc])}
          />
        </div>
      )}
    </section>
  );
}
