import Link from "next/link";

export function PageHeader({
  title,
  backHref,
  subtitle,
}: {
  title: string;
  backHref: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label="Retour"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-anthracite/20 text-anthracite"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 6 9 12 15 18"></polyline>
        </svg>
      </Link>
      <div className="min-w-0">
        {subtitle && <p className="truncate text-sm text-anthracite/60">{subtitle}</p>}
        <h1 className="truncate font-title text-2xl text-anthracite">{title}</h1>
      </div>
    </div>
  );
}
