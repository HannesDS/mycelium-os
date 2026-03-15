import Link from "next/link";
import Nav from "@/components/Nav";
import HeroVisual from "@/components/HeroVisual";
import CodeSnippet from "@/components/CodeSnippet";
import { GitHubIcon, MycelliumIcon } from "@/components/icons";

const GITHUB_URL = "https://github.com/HannesDS/mycelium-os";
const DOCS_URL = "https://github.com/HannesDS/mycelium-os#readme";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <Nav />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO
      ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center pt-14 overflow-hidden"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,0.07) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1f1f1f] bg-[#111111] text-xs text-[#888888] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                Open source · MIT license · EU-native
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.1] tracking-tight mb-6">
                The constitutional
                <br />
                layer for{" "}
                <span className="gradient-text">AI-native</span>
                <br />
                organisations.
              </h1>

              <p className="text-lg text-[#888888] leading-relaxed mb-8 max-w-lg">
                Define your company of AI agents via code, config, or chat —
                then run, visualise, and govern it as a{" "}
                <span className="text-[#ededed]">living ecosystem</span>.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#visual"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4ade80] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#22c55e] transition-colors text-sm"
                >
                  See it live
                  <ArrowRight />
                </Link>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1f1f1f] bg-[#111111] text-[#ededed] rounded-lg hover:border-[#2f2f2f] hover:bg-[#151515] transition-colors text-sm"
                >
                  <GitHubIcon />
                  Star on GitHub
                </Link>
              </div>
            </div>

            {/* Right: animated visual */}
            <div className="relative hidden lg:block">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-2 glow-green">
                {/* Terminal header */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#1f1f1f]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2 text-[#555555] text-xs font-mono">
                    visual-office.tsx
                  </span>
                </div>
                <div className="p-4">
                  <HeroVisual />
                </div>
              </div>
              {/* Floating event badge */}
              <div className="absolute -bottom-4 -left-6 flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-[#888888]">escalation_raised</span>
                <span className="text-[#555555]">→</span>
                <span className="text-[#4ade80]">ceo-shroom</span>
              </div>
              <div className="absolute -top-4 -right-6 flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
                <span className="text-[#888888]">task_completed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. WHAT IT IS — 3 value props
      ───────────────────────────────────────────────────────────── */}
      <section id="what-it-is" className="py-24 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#4ade80] uppercase tracking-widest mb-3">
              What it is
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              More than an agent framework.
              <br />
              <span className="text-[#888888]">
                A governance layer for your AI company.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ValueCard
              icon={<ConstitutionIcon />}
              accent="#4ade80"
              tag="01"
              title="Constitutional Layer"
              description="Define what each agent can and cannot do. Permissions are immutable, signed, and version-controlled. Agents propose — humans decide."
              code='cannot:\n  - execute: [send_email, payments]'
            />
            <ValueCard
              icon={<GraphIcon />}
              accent="#22d3ee"
              tag="02"
              title="Living Graph"
              description="Your organisation as a real-time visual map. Watch agents communicate, escalate, and collaborate — like a living city map of your company."
              code="graph:\n  type: reports-to"
            />
            <ValueCard
              icon={<EscalationIcon />}
              accent="#a78bfa"
              tag="03"
              title="Escalation Protocol"
              description="Every action is audited before execution. The audit log is append-only and written before any event is emitted. No exceptions."
              code="sla_response_minutes: 60"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. THE VISUAL — canvas demo
      ───────────────────────────────────────────────────────────── */}
      <section
        id="visual"
        className="py-24 border-t border-[#1f1f1f] overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono text-[#22d3ee] uppercase tracking-widest mb-3">
                The visual office
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-5">
                Watch your org
                <br />
                come alive.
              </h2>
              <p className="text-[#888888] leading-relaxed mb-6">
                Five mock shrooms — sales, delivery, billing, compliance, and
                CEO — run as a real digital agency. Messages flow. Escalations
                surface. Decisions land in your inbox.
              </p>
              <p className="text-[#888888] leading-relaxed mb-8">
                The visual office is a real-time canvas fed by the NATS event
                bus. Agents are animated nodes. Every event you see is a real{" "}
                <code className="text-[#4ade80] bg-[#111111] px-1.5 py-0.5 rounded text-sm">
                  ShroomEvent
                </code>{" "}
                on the wire.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#1f1f1f] bg-[#111111] text-sm text-[#ededed] rounded-lg hover:border-[#2f2f2f] transition-colors"
                >
                  View source
                  <ExternalLinkIcon />
                </Link>
              </div>
            </div>

            {/* Canvas visual */}
            <div className="relative">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
                  <span className="text-xs font-mono text-[#555555]">
                    visual-office — live
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#4ade80]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    5 shrooms active
                  </span>
                </div>
                <div className="p-6 flex items-center justify-center min-h-[300px]">
                  <HeroVisual />
                </div>
              </div>

              {/* Event stream overlay */}
              <div className="mt-3 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
                <div className="flex items-center px-4 py-2 border-b border-[#1f1f1f]">
                  <span className="text-xs font-mono text-[#555555]">
                    event stream
                  </span>
                </div>
                <div className="p-3 space-y-2 font-mono text-xs text-[#555555]">
                  <EventLine
                    time="14:23:01"
                    shroom="sales-shroom"
                    event="task_completed"
                    detail="lead_qualified"
                  />
                  <EventLine
                    time="14:23:03"
                    shroom="sales-shroom"
                    event="escalation_raised"
                    detail="proposal_approval"
                    accent
                  />
                  <EventLine
                    time="14:23:05"
                    shroom="ceo-shroom"
                    event="decision_received"
                    detail="proposal_approved"
                    color="#4ade80"
                  />
                  <EventLine
                    time="14:23:07"
                    shroom="delivery-shroom"
                    event="task_started"
                    detail="project_kickoff"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW IT WORKS — 3 steps
      ───────────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 border-t border-[#1f1f1f]"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Three steps to a
              <br />
              governed AI company.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Step 1 */}
            <StepCard
              number="01"
              title="Define your org"
              description="Write your constitution in mycelium.yaml. Define shrooms, their roles, what they can propose vs. execute, and who they escalate to."
              visual={<CodeSnippet />}
            />

            {/* Step 2 */}
            <StepCard
              number="02"
              title="Agents run"
              description="Shrooms execute tasks, communicate over NATS, and emit structured ShroomEvents. The visual office shows your org in real-time."
              visual={
                <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-4 space-y-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
                    <span className="text-[#22d3ee]">sales-shroom</span>
                    <span className="text-[#555555]">found lead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" style={{ animationDelay: "0.5s" }} />
                    <span className="text-[#a78bfa]">delivery-shroom</span>
                    <span className="text-[#555555]">tracking project</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fb923c] animate-pulse" style={{ animationDelay: "1s" }} />
                    <span className="text-[#fb923c]">billing-shroom</span>
                    <span className="text-[#555555]">invoice overdue</span>
                  </div>
                  <div className="border-t border-[#1f1f1f] pt-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                    <span className="text-[#fbbf24]">ceo-shroom</span>
                    <span className="text-[#555555]">3 escalations pending</span>
                  </div>
                </div>
              }
            />

            {/* Step 3 */}
            <StepCard
              number="03"
              title="You govern"
              description="Escalations land in your inbox. Approve or reject proposals. Every decision is logged. Evolve the constitution when your org changes."
              visual={
                <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden text-xs font-mono">
                  <div className="px-4 py-3 border-b border-[#1f1f1f] text-[#555555]">
                    human inbox · 1 new
                  </div>
                  <div className="p-4">
                    <div className="rounded-lg border border-[#2f2f2f] p-3 bg-[#111111]">
                      <div className="text-[#fbbf24] mb-1">
                        ⚡ Proposal: send_email
                      </div>
                      <div className="text-[#888888] mb-3">
                        sales-shroom wants to send a proposal to Acme Corp.
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-[#4ade80] text-[#0a0a0a] font-medium hover:bg-[#22c55e] transition-colors">
                          Approve
                        </button>
                        <button className="px-3 py-1 rounded border border-[#2f2f2f] text-[#888888] hover:text-[#ededed] transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. STACK
      ───────────────────────────────────────────────────────────── */}
      <section id="stack" className="py-24 border-t border-[#1f1f1f]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-mono text-[#fb923c] uppercase tracking-widest mb-3">
              Built on
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Open source, EU-native.
            </h2>
            <p className="text-[#888888] max-w-xl mx-auto">
              No vendor lock-in. Every component is open source, GDPR-ready,
              and deployable on your own infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StackCard name="Next.js" role="Frontend" color="#ededed" />
            <StackCard name="Python" role="Control plane" color="#3b82f6" />
            <StackCard name="NATS" role="Event bus" color="#4ade80" />
            <StackCard name="Neo4j" role="Graph DB" color="#fb923c" />
            <StackCard name="Kubernetes" role="Orchestration" color="#22d3ee" />
            <StackCard name="Mistral" role="LLM (EU)" color="#a78bfa" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#555555]">
            <span className="flex items-center gap-1.5">
              <span className="text-[#4ade80]">✓</span>
              MIT licensed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4ade80]">✓</span>
              GDPR compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4ade80]">✓</span>
              Self-hostable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4ade80]">✓</span>
              EU-native infrastructure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#4ade80]">✓</span>
              No vendor lock-in
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. GET STARTED
      ───────────────────────────────────────────────────────────── */}
      <section
        id="get-started"
        className="py-24 border-t border-[#1f1f1f] relative overflow-hidden"
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(74,222,128,0.06) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-mono text-[#4ade80] uppercase tracking-widest mb-4">
            Get started
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
            Your AI company,
            <br />
            governed from day one.
          </h2>
          <p className="text-[#888888] leading-relaxed mb-10 max-w-2xl mx-auto">
            Clone the repo, run{" "}
            <code className="text-[#4ade80] bg-[#111111] px-2 py-0.5 rounded">
              docker compose up
            </code>
            , and your full infrastructure is running in minutes. No cloud
            accounts, no API keys — just open source.
          </p>

          <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-4 mb-8 text-left">
            <div className="font-mono text-sm space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[#555555] select-none">$</span>
                <span className="text-[#ededed]">
                  git clone {GITHUB_URL}.git
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#555555] select-none">$</span>
                <span className="text-[#ededed]">cd mycelium-os</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#555555] select-none">$</span>
                <span className="text-[#ededed]">docker compose up</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#555555] select-none">#</span>
                <span className="text-[#4ade80]">
                  ✓ All services running at localhost:3000
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4ade80] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#22c55e] transition-colors"
            >
              <GitHubIcon />
              View on GitHub
            </Link>
            <Link
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#1f1f1f] bg-[#111111] text-[#ededed] rounded-lg hover:border-[#2f2f2f] hover:bg-[#151515] transition-colors"
            >
              Read the docs
              <ExternalLinkIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1f1f1f] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <MycelliumIcon size={16} opacity={0.6} />
              <span className="text-sm font-semibold text-[#ededed] tracking-tight">
                mycelium<span className="text-[#4ade80]">os</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-[#555555]">
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ededed] transition-colors flex items-center gap-1.5"
              >
                <GitHubIcon />
                GitHub
              </Link>
              <Link
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ededed] transition-colors"
              >
                Docs
              </Link>
              <Link
                href={`${GITHUB_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#ededed] transition-colors"
              >
                MIT License
              </Link>
            </div>

            <p className="text-xs text-[#555555] text-center md:text-right">
              Built in the open.
              <br />
              <span className="text-[#444444]">
                © {new Date().getFullYear()} Mycelium OS contributors.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

function ValueCard({
  icon,
  accent,
  tag,
  title,
  description,
  code,
}: {
  icon: React.ReactNode;
  accent: string;
  tag: string;
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-6 hover:border-[#2f2f2f] transition-colors group">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: accent + "15", border: `1px solid ${accent}30` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="text-xs font-mono text-[#555555] mb-2">{tag}</div>
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      <p className="text-sm text-[#888888] leading-relaxed mb-4">
        {description}
      </p>
      <div className="rounded-md bg-[#111111] border border-[#1f1f1f] px-3 py-2 font-mono text-xs text-[#555555] group-hover:text-[#888888] transition-colors whitespace-pre">
        {code}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  visual,
}: {
  number: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-[#4ade80]">{number}</span>
        <div className="flex-1 h-px bg-[#1f1f1f]" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-[#888888] leading-relaxed">{description}</p>
      {visual}
    </div>
  );
}

function StackCard({
  name,
  role,
  color,
}: {
  name: string;
  role: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-4 hover:border-[#2f2f2f] transition-colors text-center">
      <div
        className="text-base font-semibold mb-1"
        style={{ color }}
      >
        {name}
      </div>
      <div className="text-xs text-[#555555]">{role}</div>
    </div>
  );
}

function EventLine({
  time,
  shroom,
  event,
  detail,
  accent,
  color,
}: {
  time: string;
  shroom: string;
  event: string;
  detail: string;
  accent?: boolean;
  color?: string;
}) {
  const eventColor = color ?? (accent ? "#fbbf24" : "#555555");
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-[#333333] w-14 shrink-0">{time}</span>
      <span className="text-[#22d3ee] shrink-0">{shroom}</span>
      <span style={{ color: eventColor }}>{event}</span>
      <span className="text-[#444444]">{detail}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────

function ConstitutionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path d="M9.5 10.5L6 7.5M14.5 10.5L18 7.5M9.5 13.5L6 16.5M14.5 13.5L18 16.5" />
    </svg>
  );
}

function EscalationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l7 7-7 7M5 9h14M5 15h8" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

