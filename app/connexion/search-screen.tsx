import { SearchForm } from "./search-form";

export function SearchScreen() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-anthracite px-7 py-11 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-bvb.jpeg"
          alt="Logo BVB Le Poiré - Les Lucs"
          className="h-28 w-28 rounded-[28px] bg-white object-contain p-2"
        />

        <div className="flex flex-col items-center gap-1">
          <h1 className="font-title text-[32px] tracking-wide text-white">
            Espace club BVB
          </h1>
          <span className="text-sm text-muted-dark">Le Poiré - Les Lucs</span>
        </div>

        <SearchForm />
      </div>
    </main>
  );
}
