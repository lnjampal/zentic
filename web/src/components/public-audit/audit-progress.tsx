'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, BadgeCheck, Check, Loader2 } from 'lucide-react';
import type { AuditPage } from '@/lib/actions/audits';

const CHECKS = [
  'AI crawler access in robots.txt (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended)',
  'llms.txt',
  'Structured data (LocalBusiness, Service, FAQ)',
  'Headings, lists and content AI can read without JavaScript',
  'Direct answers to the questions customers ask',
  'Authority and trust signals: authors, sources, HTTPS, freshness',
];

function PageRow({ page }: { page: AuditPage }) {
  const icon =
    page.status === 'completed' ? (
      <Check className="size-3.5" aria-hidden="true" />
    ) : page.status === 'failed' ? (
      <AlertCircle className="size-3.5" aria-hidden="true" />
    ) : (
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
    );
  const word = page.status === 'completed' ? 'Done' : page.status === 'failed' ? 'Couldn’t load' : 'Checking';
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span
        className={
          page.status === 'completed'
            ? 'grid size-6 place-items-center rounded-full bg-secondary text-secondary-foreground'
            : page.status === 'failed'
              ? 'grid size-6 place-items-center rounded-full bg-destructive/10 text-destructive'
              : 'grid size-6 place-items-center rounded-full bg-accent text-accent-foreground'
        }
      >
        {icon}
      </span>
      <span className="w-20 font-semibold">{page.label}</span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{page.url}</span>
      <span className="text-xs text-muted-foreground">{word}</span>
    </li>
  );
}

export function AuditProgress({ domain, startedAt, pages }: { domain: string; startedAt: number; pages: AuditPage[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, now - startedAt);
  const finished = pages.filter((p) => p.status !== 'running').length;
  // Real progress once pages are known: 10% for finding them, 90% across pages.
  const pct = pages.length ? Math.round(10 + (finished / pages.length) * 85) : Math.min(10, Math.round(elapsed / 1500));

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified
          </span>
          <span className="rounded-md border px-2 py-0.5 text-xs font-semibold">{domain}</span>
        </div>
        <h1 className="font-heading text-[clamp(26px,4vw,32px)] font-bold tracking-[-0.03em]">Checking {domain}</h1>
        <p className="text-muted-foreground">
          Usually under 3 minutes. Keep this tab open; your report appears here when it’s ready.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <div className="flex justify-between text-[13px]">
          <b className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {pages.length ? `Checking your key pages: ${finished} of ${pages.length} done` : 'Finding your key pages'}
          </b>
          <span className="text-muted-foreground">{Math.floor(elapsed / 1000)}s</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Audit progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-chart-1 transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border p-5">
          <h2 className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[1.3px] text-muted-foreground">
            Pages · home + up to 4 key pages
          </h2>
          {pages.length ? (
            <ul className="divide-y">
              {pages.map((p) => (
                <PageRow key={p.id} page={p} />
              ))}
            </ul>
          ) : (
            <p className="py-2.5 text-sm text-muted-foreground">Reading your home page to find contact, services, pricing and booking pages…</p>
          )}
        </section>
        <section className="rounded-xl border p-5">
          <h2 className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[1.3px] text-muted-foreground">What we check on each page</h2>
          <ul className="divide-y">
            {CHECKS.map((c) => (
              <li key={c} className="py-2.5 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
