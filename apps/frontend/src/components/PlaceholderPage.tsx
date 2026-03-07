interface PlaceholderPageProps {
  title: string;
  description: string;
  ticketId: string;
}

export function PlaceholderPage({ title, description, ticketId }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
      <div className="rounded-xl border border-white/10 bg-white/5 px-10 py-8 text-center max-w-md">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-neutral-400">{description}</p>
        <span className="mt-4 inline-block rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400">
          {ticketId}
        </span>
      </div>
    </div>
  );
}
