"use client";

import { useEffect, useState, useTransition } from "react";
import { searchMateriel } from "./actions";

export function MaterielInput({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const trimmed = text.trim();

  useEffect(() => {
    if (trimmed.length < 1) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setSuggestions((await searchMateriel(trimmed)).filter((t) => !items.includes(t)));
      });
    }, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  const visibleSuggestions = trimmed.length < 1 ? [] : suggestions;

  function addItem(item: string) {
    const clean = item.trim();
    if (!clean || items.includes(clean)) return;
    onChange([...items, clean]);
    setText("");
    setSuggestions([]);
  }

  function removeItem(item: string) {
    onChange(items.filter((t) => t !== item));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(text);
    } else if (e.key === "Backspace" && text === "" && items.length > 0) {
      removeItem(items[items.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-anthracite/20 px-2 py-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-full bg-turquoise/15 px-3 py-1 text-sm text-turquoise-contrast"
          >
            {item}
            <button type="button" onClick={() => removeItem(item)} className="font-bold">
              ×
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={items.length === 0 ? "Ajouter un matériel…" : ""}
          className="h-8 min-w-[8rem] flex-1 outline-none"
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addItem(s)}
              className="rounded-full border border-anthracite/20 px-3 py-1 text-sm text-anthracite/70"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
