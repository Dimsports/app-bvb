"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { installFirstAdmin } from "./actions";

export function InstallationForm() {
  const [token, setToken] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await installFirstAdmin({ token, prenom, nom });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode(result.code);
    });
  }

  if (code) {
    return (
      <div className="rounded-xl border-2 border-turquoise bg-turquoise/10 p-4">
        <p className="text-sm text-anthracite">
          Compte admin créé pour <strong>{prenom} {nom}</strong>. Code à noter maintenant,
          il ne sera plus affiché :
        </p>
        <p className="mt-2 font-title text-3xl tracking-widest text-turquoise-contrast">
          {code}
        </p>
        <Link
          href="/connexion"
          className="mt-4 inline-flex h-11 items-center rounded-lg bg-anthracite px-4 text-sm font-medium text-white"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Jeton d&apos;installation</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="h-11 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Prénom</span>
        <input
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="h-11 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-anthracite/60">Nom</span>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="h-11 rounded-lg border border-anthracite/20 px-3"
          required
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 h-12 rounded-xl bg-anthracite font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Création…" : "Créer le compte admin"}
      </button>
    </form>
  );
}
