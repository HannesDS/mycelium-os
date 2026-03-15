export default function CodeSnippet() {
  return (
    <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden text-sm font-mono">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1f1f1f]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[#555555] text-xs">mycelium.yaml</span>
      </div>

      <div className="p-4 space-y-0.5 leading-6 text-xs">
        <div>
          <span className="text-[#888888]">company:</span>
        </div>
        <div className="pl-4">
          <span className="text-[#888888]">name: </span>
          <span className="text-[#4ade80]">&quot;Acme AI Co&quot;</span>
        </div>
        <div className="pl-4">
          <span className="text-[#888888]">instance: </span>
          <span className="text-[#22d3ee]">production</span>
        </div>
        <div className="mt-2">
          <span className="text-[#888888]">shrooms:</span>
        </div>
        <div className="pl-4">
          <span className="text-[#a78bfa]">- id: </span>
          <span className="text-[#fb923c]">sales-shroom</span>
        </div>
        <div className="pl-6">
          <span className="text-[#888888]">role: </span>
          <span className="text-[#4ade80]">&quot;Sales Development&quot;</span>
        </div>
        <div className="pl-6">
          <span className="text-[#888888]">model: </span>
          <span className="text-[#22d3ee]">mistral-7b</span>
        </div>
        <div className="pl-6">
          <span className="text-[#888888]">can:</span>
        </div>
        <div className="pl-8">
          <span className="text-[#4ade80]">- propose: </span>
          <span className="text-[#ededed]">[send_email, book_meeting]</span>
        </div>
        <div className="pl-6">
          <span className="text-[#888888]">cannot:</span>
        </div>
        <div className="pl-8">
          <span className="text-[#f87171]">- execute: </span>
          <span className="text-[#ededed]">[send_email, payments]</span>
        </div>
        <div className="pl-6">
          <span className="text-[#888888]">escalates_to: </span>
          <span className="text-[#a78bfa]">ceo-shroom</span>
        </div>
      </div>
    </div>
  );
}
