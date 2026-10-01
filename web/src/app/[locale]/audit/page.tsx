import type { Metadata } from 'next';
import { AuditStart } from '@/components/public-audit/audit-start';
import { isSignedIn } from '@/lib/signed-in';

export const metadata: Metadata = {
  title: 'Free AI readiness audit | Zentic',
  description: 'See what AI assistants and AI search can find, read and trust on your website. Free, no account needed.',
};

export default async function AuditStartPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  return <AuditStart signedIn={await isSignedIn()} initialUrl={url ?? ''} />;
}
