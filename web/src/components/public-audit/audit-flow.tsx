'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import type { AuditResult } from '@/lib/actions/audits';
import { getClaim, getPublicAudit, startAudit, PublicAuditError, type PublicClaim } from '@/lib/public-audit';
import { AuditShell } from './audit-shell';
import { VerifyStep } from './verify-step';
import { AuditProgress } from './audit-progress';
import { ReportSummary } from './report-summary';

type Phase =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'error'; message: string }
  | { kind: 'verify' }
  | { kind: 'running'; auditId: string; startedAt: number; audit: AuditResult | null }
  | { kind: 'report'; audit: AuditResult };

const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

export function AuditFlow({ claimId, signedIn }: { claimId: string; signedIn: boolean }) {
  const searchParams = useSearchParams();
  const justSaved = searchParams.get('saved') === '1';
  const dashFromUrl = searchParams.get('dash');
  const [savedInfo, setSavedInfo] = useState<{ email: string | null; dashboardAuditId: string | null } | null>(
    justSaved ? { email: null, dashboardAuditId: dashFromUrl } : null,
  );
  const [claim, setClaim] = useState<PublicClaim | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [startError, setStartError] = useState<string | null>(null);
  const pollRef = useRef(0);

  const poll = useCallback(
    async (auditId: string, startedAt: number) => {
      const gen = ++pollRef.current;
      setPhase({ kind: 'running', auditId, startedAt, audit: null });
      while (gen === pollRef.current) {
        try {
          const audit = await getPublicAudit(claimId, auditId);
          if (gen !== pollRef.current) return;
          if (audit.status !== 'running') {
            setPhase({ kind: 'report', audit });
            return;
          }
          setPhase({ kind: 'running', auditId, startedAt, audit });
        } catch (err) {
          if (gen !== pollRef.current) return;
          if (err instanceof PublicAuditError && err.status === 404) {
            setPhase({ kind: 'missing' });
            return;
          }
        }
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setPhase({ kind: 'error', message: 'The audit is taking longer than usual. Refresh this page in a minute to see your report.' });
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    },
    [claimId],
  );

  const runAudit = useCallback(async () => {
    setStartError(null);
    try {
      const audit = await startAudit(claimId);
      void poll(audit.id, Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We couldn’t start the audit. Please try again.';
      if (err instanceof PublicAuditError && err.code === 'not_verified') {
        setClaim((c) => (c ? { ...c, verified: false } : c));
        setPhase({ kind: 'verify' });
      }
      setStartError(message);
    }
  }, [claimId, poll]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getClaim(claimId);
        if (cancelled) return;
        setClaim(c);
        if (!c.verified && !c.latestAuditId) return setPhase({ kind: 'verify' });
        if (c.latestAuditId) {
          const audit = await getPublicAudit(claimId, c.latestAuditId);
          if (cancelled) return;
          if (audit.status === 'running') return void poll(audit.id, new Date(audit.createdAt).getTime());
          return setPhase({ kind: 'report', audit });
        }
        // Verified but never audited (e.g. a reload right after verifying).
        void runAudit();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof PublicAuditError && err.status === 404) setPhase({ kind: 'missing' });
        else setPhase({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
      }
    })();
    return () => {
      cancelled = true;
      pollRef.current++;
    };
  }, [claimId, poll, runAudit]);

  const step = phase.kind === 'verify' ? 1 : phase.kind === 'running' ? 2 : phase.kind === 'report' ? 3 : 1;

  return (
    <AuditShell step={step} signedIn={signedIn}>
      {phase.kind === 'loading' && (
        <div className="grid place-items-center py-24 text-muted-foreground" role="status">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      )}

      {phase.kind === 'missing' && (
        <Notice title="We couldn’t find that audit" body="The link may be incomplete. Start a new free audit for your site.">
          <Button asChild>
            <Link href="/audit">Start a free audit</Link>
          </Button>
        </Notice>
      )}

      {phase.kind === 'error' && (
        <Notice title="Something went wrong" body={phase.message}>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </Notice>
      )}

      {phase.kind === 'verify' && claim && (
        <VerifyStep
          claim={claim}
          startError={startError}
          onVerified={(c) => {
            setClaim(c);
            void runAudit();
          }}
        />
      )}

      {phase.kind === 'running' && claim && (
        <AuditProgress domain={claim.domain} startedAt={phase.startedAt} pages={phase.audit?.pages ?? []} />
      )}

      {phase.kind === 'report' && claim && (
        <ReportSummary
          claim={claim}
          audit={phase.audit}
          signedIn={signedIn}
          justSaved={justSaved || Boolean(savedInfo)}
          savedInfo={savedInfo}
          onSaved={(info) => {
            setSavedInfo(info);
            setClaim((c) => (c ? { ...c, saved: true } : c));
          }}
          reauditError={startError}
          onReaudit={runAudit}
        />
      )}
    </AuditShell>
  );
}

function Notice({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-4 py-20 text-center">
      <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
      <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
