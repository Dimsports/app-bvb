"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PARTIE_LABELS, PARTIE_COLOR_VAR, isPartie } from "@/lib/exercises/constants";
import type { SeanceBloc } from "@/lib/seances/queries";
import { MediaDisplay } from "@/app/bibliotheque/media-display";
import { createAlarm } from "./alarm";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let sentinel: { release: () => Promise<void> } | null = null;

    async function requestLock() {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
        };
        sentinel = (await nav.wakeLock?.request("screen")) ?? null;
      } catch {
        // Wake Lock indisponible (navigateur ou contexte non sécurisé) : tant pis.
      }
    }

    requestLock();

    function handleVisibility() {
      if (document.visibilityState === "visible") requestLock();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}

export function TerrainView({
  seanceId,
  titre,
  blocs,
}: {
  seanceId: string;
  titre: string | null;
  blocs: SeanceBloc[];
}) {
  const [index, setIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(blocs[0] ? blocs[0].duree_minutes * 60 : 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const alarmRef = useRef(createAlarm());
  const remainingRef = useRef(remainingSeconds);

  useWakeLock(true);

  const bloc = blocs[index];

  function resetTimerFor(newIndex: number) {
    alarmRef.current.stop();
    setIsRunning(false);
    setIsFinished(false);
    const seconds = (blocs[newIndex]?.duree_minutes ?? 0) * 60;
    remainingRef.current = seconds;
    setRemainingSeconds(seconds);
  }

  function goTo(newIndex: number) {
    if (newIndex < 0 || newIndex >= blocs.length) return;
    setIndex(newIndex);
    resetTimerFor(newIndex);
  }

  function handlePlayPause() {
    if (!isRunning) alarmRef.current.prime();
    setIsRunning((prev) => !prev);
  }

  function handleReset() {
    resetTimerFor(index);
  }

  function handleStopAlarm() {
    alarmRef.current.stop();
    setIsFinished(false);
  }

  function handleStopAndNext() {
    alarmRef.current.stop();
    setIsFinished(false);
    if (index < blocs.length - 1) {
      goTo(index + 1);
    }
  }

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - 1);
      setRemainingSeconds(remainingRef.current);
      if (remainingRef.current === 0) {
        setIsRunning(false);
        setIsFinished(true);
        alarmRef.current.start();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const alarm = alarmRef.current;
    return () => alarm.stop();
  }, []);

  if (!bloc) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-field-bg px-6 text-center text-white">
        <p>Cette séance n&apos;a pas encore de blocs.</p>
        <Link href={`/seances/${seanceId}`} className="text-turquoise underline">
          Retour à la séance
        </Link>
      </main>
    );
  }

  const partieColor = isPartie(bloc.exercice.partie) ? PARTIE_COLOR_VAR[bloc.exercice.partie] : "transparent";
  const lowTime = remainingSeconds > 0 && remainingSeconds <= 10;

  return (
    <main className="relative flex min-h-screen flex-col bg-field-bg px-5 py-6 text-white">
      <header className="flex items-center justify-between">
        <Link href={`/seances/${seanceId}`} className="text-sm text-muted-dark">
          ← Quitter
        </Link>
        <span className="text-sm text-muted-dark">
          Bloc {index + 1}/{blocs.length}
        </span>
      </header>

      <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: partieColor, color: "var(--color-on-turquoise)" }}
          >
            {isPartie(bloc.exercice.partie) ? PARTIE_LABELS[bloc.exercice.partie] : bloc.exercice.partie}
          </span>
          <h1 className="font-title text-3xl leading-tight">{bloc.exercice.titre}</h1>
          {titre && <p className="text-sm text-muted-dark">{titre}</p>}
        </div>

        {bloc.exercice.media_type && (
          <div className="w-full max-w-sm">
            <MediaDisplay
              mediaType={bloc.exercice.media_type}
              mediaUrl={bloc.exercice.media_url}
              mediaPlatform={bloc.exercice.media_platform}
              dark
            />
          </div>
        )}

        {bloc.exercice.consignes && (
          <p className="max-w-sm text-center text-lg text-white/90">{bloc.exercice.consignes}</p>
        )}

        <div className="flex flex-col items-center gap-4">
          <span
            className={`font-title text-7xl tabular-nums ${lowTime ? "text-red-400" : "text-white"}`}
          >
            {formatTime(remainingSeconds)}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePlayPause}
              className="h-14 w-32 rounded-2xl bg-turquoise text-lg font-semibold text-on-turquoise"
            >
              {isRunning ? "Pause" : "Lancer"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-14 w-20 rounded-2xl border border-border-dark text-sm font-medium text-white"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className="h-14 flex-1 rounded-2xl border border-border-dark text-base font-medium text-white disabled:opacity-30"
        >
          ← Précédent
        </button>
        <button
          type="button"
          disabled={index === blocs.length - 1}
          onClick={() => goTo(index + 1)}
          className="h-14 flex-1 rounded-2xl border border-border-dark text-base font-medium text-white disabled:opacity-30"
        >
          Suivant →
        </button>
      </div>

      {isFinished && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-anthracite/95 px-6 text-center">
          <p className="font-title text-4xl text-white">Temps écoulé !</p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={handleStopAndNext}
              className="h-14 rounded-2xl bg-turquoise text-base font-semibold text-on-turquoise"
            >
              Arrêter et passer à la suite
            </button>
            <button
              type="button"
              onClick={handleStopAlarm}
              className="h-14 rounded-2xl border border-border-dark text-base font-medium text-white"
            >
              Arrêter
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
