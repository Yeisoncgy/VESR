import { RoomView } from "./RoomView";
import { parseSourceUrl, type SourceType } from "@/lib/sources";

type SearchParams = Promise<{ src?: string; t?: string }>;

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const src = sp.src ?? "";
  const t = (sp.t as SourceType | undefined) ?? null;

  const parsed = parseSourceUrl(src);
  if (!parsed || !t || (parsed.type !== t)) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="surface-card max-w-md rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Sala inválida</h1>
          <p className="text-[var(--muted)] text-sm">
            Este link no contiene un set válido. Vuelve al inicio y crea una sala nueva.
          </p>
          <a
            href="/"
            className="mt-4 inline-block rounded-lg border border-[var(--cyan)] px-4 py-2 text-xs uppercase tracking-wider text-[var(--cyan)]"
          >
            Volver
          </a>
        </div>
      </main>
    );
  }

  return <RoomView roomId={id} source={parsed} />;
}
