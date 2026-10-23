"use client";

import { useState, useTransition } from "react";
import { verifyMemberCode } from "./actions";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function Numpad({
  memberId,
  codeLength,
  initiallyLocked,
}: {
  memberId: string;
  codeLength: 4 | 6;
  initiallyLocked: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    initiallyLocked ? "Compte bloqué suite à trop d'essais." : null
  );
  const [locked, setLocked] = useState(initiallyLocked);
  const [isPending, startTransition] = useTransition();

  function submit(fullCode: string) {
    startTransition(async () => {
      const result = await verifyMemberCode({ memberId, code: fullCode });
      if (result && !result.ok) {
        setError(result.error);
        setCode("");
        if (result.error.includes("bloqué")) {
          setLocked(true);
        }
      }
    });
  }

  function handleKey(key: string) {
    if (locked || isPending) return;
    setError(null);

    if (key === "⌫") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (key === "") return;

    const next = (code + key).slice(0, codeLength);
    setCode(next);
    if (next.length === codeLength) {
      submit(next);
    }
  }

  const prompt = isPending
    ? "Vérification…"
    : error ?? `Entre ton code à ${codeLength} chiffres`;

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-between gap-6 py-2">
      <div className="flex flex-col items-center gap-3">
        <span className={`text-sm ${error ? "text-red-400" : "text-[#d4dadc]"}`}>
          {prompt}
        </span>
        <div className="flex gap-[18px]">
          {Array.from({ length: codeLength }).map((_, i) => (
            <span
              key={i}
              className="h-[18px] w-[18px] rounded-full border-2"
              style={{
                borderColor: i < code.length ? "var(--color-turquoise)" : "var(--color-dot-empty)",
                background: i < code.length ? "var(--color-turquoise)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5">
        <div className="grid w-full grid-cols-3 gap-3">
          {KEYS.map((key, i) => (
            <button
              key={i}
              type="button"
              disabled={key === "" || locked || isPending}
              onClick={() => handleKey(key)}
              className="font-title h-[60px] rounded-2xl bg-key-bg text-[28px] font-semibold text-white transition active:bg-turquoise/30 disabled:bg-transparent"
            >
              {key}
            </button>
          ))}
        </div>

        <span className="text-[13px] font-semibold text-muted-dark">
          Code oublié ? Demande à l&apos;administrateur
        </span>
      </div>
    </div>
  );
}
