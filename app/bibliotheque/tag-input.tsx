"use client";

import { useEffect, useState, useTransition } from "react";
import { searchTags } from "./actions";

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const trimmed = text.trim();

  useEffect(() => {
    if (trimmed.length < 1) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setSuggestions((await searchTags(trimmed)).filter((t) => !tags.includes(t)));
      });
    }, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  const visibleSuggestions = trimmed.length < 1 ? [] : suggestions;

  function addTag(tag: string) {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setText("");
    setSuggestions([]);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(text);
    } else if (e.key === "Backspace" && text === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-anthracite/20 px-2 py-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-turquoise/15 px-3 py-1 text-sm text-turquoise-contrast"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="font-bold">
              ×
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Ajouter un tag…" : ""}
          className="h-8 min-w-[8rem] flex-1 outline-none"
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
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
