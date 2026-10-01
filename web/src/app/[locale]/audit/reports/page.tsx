import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { AuditShell } from '@/components/public-audit/audit-shell';
import { listSavedClaims } from '@/lib/actions/public-audit';
import { isSignedIn } from '@/lib/signed-in';

export const metadata: Metadata = { title: 'My AI readiness reports | Zentic', robots: { index: false, follow: false } };

export default async function AuditReportsPage() {
  if (!(await isSignedIn())) redirect(`/sign-in?next=${encodeURIComponent('/audit/reports')}`);
  const claims = await listSavedClaims();

  return (
    <AuditShell step={3} signedIn>
      <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <div className="font-mono text-[11px] uppercase tracking-[1.3px] text-muted-foreground">AI readiness</div>
            <h1 className="font-heading text-[28px] font-bold tracking-[-0.03em]">My reports</h1>
          </div>
          <Button asChild>
            <Link href="/audit">Audit another site</Link>
          </Button>
        </div>
        {claims.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No saved reports yet. Run a free audit and save it to see it here.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {claims.map((c) => {
              const latest = c.audits[0];
              const score = latest?.totalScore == null ? null : Math.round(latest.totalScore * 100);
              return (
                <li key={c.id}>
                  <Link
                    href={`/audit/${c.id}`}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="flex-1">
                      <b className="text-[15px]">{c.domain}</b>
                      <div className="text-[13px] text-muted-foreground">
                        {c.audits.length} {c.audits.length === 1 ? 'audit' : 'audits'}
                        {latest ? ` · last ${new Date(latest.createdAt).toLocaleDateString()}` : ''}
                        {c.verified ? '' : ' · verification removed'}
                      </div>
                    </div>
                    <span className="font-heading text-2xl font-bold">{score ?? '–'}</span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AuditShell>
  );
}
