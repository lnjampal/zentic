'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Copy, Download, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { Badge } from '@workspace/ansvisor-design-system/components/ui/badge';
import { Checkbox } from '@workspace/ansvisor-design-system/components/ui/checkbox';
import { Label } from '@workspace/ansvisor-design-system/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ansvisor-design-system/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ansvisor-design-system/components/ui/dialog';
import type { AuditResult } from '@/lib/actions/audits';
import { CATEGORY_META } from '@/components/audit/audit-report';
import { fixesMailto, points, rankFixes, readinessBand, type PublicClaim, type RankedFix } from '@/lib/public-audit';
import { savePublicClaim } from '@/lib/actions/public-audit';

const FREE_FIXES_SHOWN = 5;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error('Couldn’t copy. Select the text and copy it instead.');
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? 'Copied' : 'Copy fix'}
    </Button>
  );
}

function affectedPages(fix: RankedFix): string[] {
  const pages = (fix.signal.evidence as { pages?: { label: string; status: string }[] })?.pages ?? [];
  return pages.filter((p) => p.status === 'fail' || p.status === 'warn').map((p) => p.label);
}

function FixItem({ fix, index }: { fix: RankedFix; index: number }) {
  const { signal, recommendation } = fix;
  const draft = recommendation?.draft ?? null;
  const foundOn = affectedPages(fix);
  return (
    <AccordionItem value={signal.key} className="rounded-lg border px-4 md:px-5">
      <AccordionTrigger className="gap-3 py-4 hover:no-underline">
        <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-2 text-left">
          <span className="w-6 font-heading text-base font-bold">{index + 1}</span>
          <span className="min-w-[min(100%,14rem)] flex-1 text-[15px] font-semibold">{signal.label}</span>
          <Badge variant={fix.impact === 'High' ? 'default' : 'outline'}>Impact: {fix.impact}</Badge>
          <Badge variant="outline">{signal.status === 'fail' ? 'Missing' : 'Needs work'}</Badge>
          {foundOn.length > 0 && (
            <span className="basis-full pl-9 text-[13px] font-normal text-muted-foreground">Found on: {foundOn.join(', ')}</span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <div className="grid gap-5 md:grid-cols-2 md:pl-9">
          <div className="flex flex-col gap-3 text-sm">
            {(signal.why || signal.what) && (
              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">Why it matters for AI</div>
                <p>{signal.why ?? signal.what}</p>
              </div>
            )}
            <div>
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">How to fix it</div>
              <p>{recommendation?.recommendation ?? signal.howToFix ?? 'See the full report for details.'}</p>
            </div>
            <div>
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">How to check it worked</div>
              <p>Apply the fix, publish your site, then re-audit. This check turns green when it’s fixed.</p>
            </div>
          </div>
          {draft ? (
            <div className="flex flex-col gap-2">
              <div className="font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">Ready-to-paste fix</div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-secondary px-3.5 py-3 font-mono text-xs leading-relaxed text-secondary-foreground">
                {draft}
              </pre>
              <div>
                <CopyButton value={draft} />
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted p-4 text-[13px] text-muted-foreground">
              No code to paste for this one. Follow the steps on the left, or send them to your web person.
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ReportSummary({
  claim,
  audit,
  signedIn,
  justSaved,
  savedInfo,
  onSaved,
  reauditError,
  onReaudit,
}: {
  claim: PublicClaim;
  audit: AuditResult;
  signedIn: boolean;
  justSaved: boolean;
  savedInfo: { email: string | null; dashboardAuditId: string | null } | null;
  onSaved: (info: { email: string | null; dashboardAuditId: string | null }) => void;
  reauditError: string | null;
  onReaudit: () => Promise<void>;
}) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [reauditing, setReauditing] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Signed in: save straight to the account. Signed out: ask them to sign up or in first. */
  async function save() {
    if (!signedIn) {
      setSaveOpen(true);
      return;
    }
    setSaving(true);
    try {
      const result = await savePublicClaim(claim.id, consent);
      if (result.ok) {
        onSaved({ email: result.owner.email, dashboardAuditId: result.dashboardAuditId });
        toast.success(result.owner.email ? `Report saved to ${result.owner.email}` : 'Report saved to your account');
      } else if (result.status === 401) {
        setSaveOpen(true);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('We couldn’t save the report. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  const fixes = useMemo(() => rankFixes(audit), [audit]);
  const saved = claim.saved;
  const shown = saved ? fixes : fixes.slice(0, FREE_FIXES_SHOWN);
  const hidden = fixes.length - shown.length;
  const score = points(audit.totalScore);
  const checkedPages = (audit.pages ?? []).filter((p) => p.status === 'completed');
  const failedPages = (audit.pages ?? []).filter((p) => p.status === 'failed');
  const band = readinessBand(audit.totalScore);
  const reportUrl = typeof window !== 'undefined' ? `${window.location.origin}/audit/${claim.id}` : '';
  const savePath = `/audit/${claim.id}/save${consent ? '?consent=1' : ''}`;

  if (audit.status === 'failed') {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center gap-4 px-4 py-20 text-center">
        <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold">We couldn’t finish checking {claim.domain}</h1>
        <p className="text-muted-foreground">
          {audit.error ? `The audit stopped with: ${audit.error}` : 'The site didn’t respond in time.'} Make sure the site is online
          and not blocking visitors, then try again.
        </p>
        {reauditError && <p role="alert" className="text-sm text-destructive">{reauditError}</p>}
        <Button
          disabled={reauditing}
          onClick={async () => {
            setReauditing(true);
            await onReaudit();
            setReauditing(false);
          }}
        >
          <RefreshCw aria-hidden="true" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-12 md:py-10 print:max-w-none print:p-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[1.3px] text-muted-foreground">
            AI readiness report · {claim.domain}
          </div>
          <h1 className="font-heading text-[clamp(26px,4vw,30px)] font-bold tracking-[-0.03em]">Your AI readiness report</h1>
          <span className="text-sm text-muted-foreground">
            Checked {checkedPages.length > 1 ? `${checkedPages.length} pages on ${claim.domain}` : (audit.finalUrl ?? audit.url)} on{' '}
            {new Date(audit.completedAt ?? audit.createdAt).toLocaleString()} · {audit.signalsEvaluated ?? 0} of {audit.signalsTotal} checks
            applied
          </span>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {saved ? (
            <>
              <Button variant="outline" onClick={() => window.print()}>
                <Download aria-hidden="true" /> Download PDF
              </Button>
              <Button
                disabled={reauditing}
                onClick={async () => {
                  setReauditing(true);
                  await onReaudit();
                  setReauditing(false);
                }}
              >
                <RefreshCw aria-hidden="true" className={reauditing ? 'animate-spin' : undefined} /> Re-audit after fixes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={save} disabled={saving}>
                <Download aria-hidden="true" /> Download PDF
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save my report'}
              </Button>
            </>
          )}
        </div>
      </div>

      {saved ? (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm print:hidden">
          <Check className="size-4 text-primary" aria-hidden="true" />
          <b>
            {savedInfo?.email ? `Saved to ${savedInfo.email}.` : justSaved ? 'Report saved to your account.' : 'Saved to your account.'}
          </b>
          {savedInfo?.dashboardAuditId && (
            <Link href={`/dashboard/audit/${savedInfo.dashboardAuditId}`} className="font-medium underline underline-offset-4">
              Also in your dashboard
            </Link>
          )}
          <span className="text-muted-foreground">
            Free: one re-audit after you apply fixes, then one a month. We check your verification first.
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground print:hidden">
          <b>This summary is free.</b>
          <span>Save it to see every finding, download the PDF and re-audit after you fix things.</span>
        </div>
      )}
      {reauditError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {reauditError}
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]" aria-label="Scores">
        <div className="flex flex-col gap-2.5 rounded-xl bg-secondary p-6 text-secondary-foreground">
          <span className="font-mono text-[11px] uppercase tracking-[1.3px] text-secondary-foreground/80">AI readiness score</span>
          <span className="font-heading text-6xl font-extrabold leading-none tracking-[-0.04em]">
            {score ?? '–'}
            <span className="text-2xl text-secondary-foreground/80"> / 100</span>
          </span>
          {band && (
            <span className="self-start rounded-md bg-chart-4 px-2.5 py-0.5 text-[13px] font-bold text-primary-foreground">{band}</span>
          )}
          <span className="text-[13px] text-secondary-foreground/80">Not ready under 40 · Partly ready 40–69 · Ready 70+</span>
        </div>
        <div className="grid content-start grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_META.map((c) => {
            const s = audit.categoryScores[c.key]?.score ?? null;
            const p = points(s);
            return (
              <div key={c.key} className="flex flex-col gap-2 rounded-lg border p-4">
                <span className="font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">{c.label}</span>
                <b className="font-heading text-2xl">{p ?? '–'}</b>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-chart-1" style={{ width: `${p ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(audit.pages?.length ?? 0) > 0 && (
        <section aria-labelledby="pages-title" className="flex flex-col gap-2">
          <h2 id="pages-title" className="font-heading text-base font-bold">
            Pages checked
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {(audit.pages ?? []).map((p) => (
              <li key={p.id} className="flex flex-col gap-1 rounded-lg border p-3">
                <span className="flex items-center justify-between gap-2">
                  <b className="text-sm">{p.label}</b>
                  <span className="font-heading text-lg font-bold">
                    {p.status === 'completed' ? points(p.totalScore) ?? '–' : '–'}
                  </span>
                </span>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-muted-foreground underline-offset-4 hover:underline">
                  {p.url.replace(/^https?:\/\//, '')}
                </a>
                {p.status === 'failed' && <span className="text-xs text-destructive">Couldn’t load this page</span>}
              </li>
            ))}
          </ul>
          {failedPages.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              Scores cover the {checkedPages.length} {checkedPages.length === 1 ? 'page' : 'pages'} we could load.
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="fixes-title">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <h2 id="fixes-title" className="font-heading text-xl font-bold">
              {fixes.length ? 'Fix these first' : 'Nothing urgent to fix'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {fixes.length
                ? `${fixes.length} ${fixes.length === 1 ? 'finding' : 'findings'}, ranked by impact on AI.`
                : 'Every check we could apply passed. Re-audit after big site changes.'}
            </p>
          </div>
          {fixes.length > 0 && (
            <Button asChild variant="outline" className="print:hidden">
              <a href={fixesMailto(claim.domain, fixes, reportUrl)}>
                <Mail aria-hidden="true" /> Send fixes to my web person
              </a>
            </Button>
          )}
        </div>
        {shown.length > 0 && (
          <Accordion type="multiple" defaultValue={[shown[0].signal.key]} className="flex flex-col gap-2.5">
            {shown.map((f, i) => (
              <FixItem key={f.signal.key} fix={f} index={i} />
            ))}
          </Accordion>
        )}
        {hidden > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4 text-sm print:hidden">
            <span className="flex-1">
              <b>{hidden} more {hidden === 1 ? 'finding' : 'findings'}</b> in your full report once you save it.
            </span>
            <Button variant="outline" onClick={save} disabled={saving}>
              Save to see all <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col items-start gap-4 rounded-xl border bg-muted p-6 md:flex-row md:items-center print:hidden">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">Next: turn AI attention into bookings</div>
          <b className="font-heading text-lg">Customers ask the same questions after hours.</b>
          <span className="text-sm text-muted-foreground">
            The AI Chat Assistant answers them on your website and WhatsApp, using what we just read on your site, and books them in.
          </span>
        </div>
        <Button asChild variant="secondary">
          <Link href="/#offers">See the chat assistant</Link>
        </Button>
      </section>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Save your report</DialogTitle>
            <DialogDescription>
              Keep {claim.domain}’s report, see every finding, download the PDF and re-audit after you fix things.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {signedIn ? (
              <Button asChild size="lg">
                <Link href={savePath}>Save to my account</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href={`/sign-up?next=${encodeURIComponent(savePath)}`}>Create a free account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={`/sign-in?next=${encodeURIComponent(savePath)}`}>I already have an account</Link>
                </Button>
              </>
            )}
            <div className="flex items-start gap-2.5 border-t pt-3">
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <Label htmlFor="consent" className="text-[13px] font-normal leading-snug">
                Send me tips and product news (optional, separate from your account)
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
