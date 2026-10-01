import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { AuditShell } from '@/components/public-audit/audit-shell';
import { savePublicClaim } from '@/lib/actions/public-audit';
import { isSignedIn } from '@/lib/signed-in';

export const metadata: Metadata = { title: 'Save your report | Zentic', robots: { index: false, follow: false } };

export default async function AuditSavePage({
  params,
  searchParams,
}: {
  params: Promise<{ claimId: string }>;
  searchParams: Promise<{ consent?: string }>;
}) {
  const { claimId } = await params;
  const { consent } = await searchParams;
  const here = `/audit/${claimId}/save${consent === '1' ? '?consent=1' : ''}`;

  if (!(await isSignedIn())) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  const result = await savePublicClaim(claimId, consent === '1');
  if (result.ok) {
    redirect(`/audit/${claimId}?saved=1${result.dashboardAuditId ? `&dash=${result.dashboardAuditId}` : ''}`);
  }
  if (result.status === 401) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  return (
    <AuditShell step={3} signedIn>
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">We couldn’t save this report</h1>
        <p className="text-muted-foreground">{result.message}</p>
        <Button asChild>
          <Link href={`/audit/${claimId}`}>Back to the report</Link>
        </Button>
      </div>
    </AuditShell>
  );
}
