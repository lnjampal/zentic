import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuditFlow } from '@/components/public-audit/audit-flow';
import { isSignedIn } from '@/lib/signed-in';

export const metadata: Metadata = {
  title: 'Your AI readiness audit | Zentic',
  robots: { index: false, follow: false },
};

export default async function AuditClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  const signedIn = await isSignedIn();
  return (
    <Suspense>
      <AuditFlow claimId={claimId} signedIn={signedIn} />
    </Suspense>
  );
}
