'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { Input } from '@workspace/ansvisor-design-system/components/ui/input';
import { Label } from '@workspace/ansvisor-design-system/components/ui/label';
import { createClaim } from '@/lib/public-audit';
import { AuditShell } from './audit-shell';

const HOW = [
  { title: '1. Enter your site', body: 'One field, no sign-up.' },
  { title: '2. Prove it’s yours', body: 'A tag, DNS record or file.' },
  { title: '3. Get your report', body: 'Usually under 3 minutes.' },
];

export function AuditStart({ signedIn, initialUrl = '' }: { signedIn: boolean; initialUrl?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError('Enter your website address, like yourbusiness.com.');
      return;
    }
    setBusy(true);
    try {
      const claim = await createClaim(url);
      router.push(`/audit/${claim.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <AuditShell step={0} signedIn={signedIn}>
      <div className="mx-auto flex max-w-[680px] flex-col items-center gap-8 px-4 py-14 md:py-20">
        <div className="flex flex-col gap-3 text-center">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[1.3px] text-muted-foreground">
            Free AI readiness audit · no account needed
          </div>
          <h1 className="font-heading text-[clamp(30px,5vw,40px)] font-bold leading-[1.1] tracking-[-0.04em]">
            See what AI sees on your website.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Get a scored report on how ready your site is for AI assistants and AI search, with fixes written for owners.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-3 rounded-xl border bg-card p-5 md:p-7">
          <Label htmlFor="site-url" className="text-sm font-semibold">
            Your website
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="site-url"
              name="url"
              inputMode="url"
              autoComplete="url"
              autoFocus
              placeholder="yourbusiness.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'site-url-error site-url-help' : 'site-url-help'}
              className="h-11 flex-1 text-[15px]"
            />
            <Button type="submit" size="lg" disabled={busy} className="h-11 px-6">
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Check my site {!busy && <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
          <p id="site-url-help" className="text-[13px] text-muted-foreground">
            We add https:// for you and check your home page for what AI assistants need.
          </p>
          {error && (
            <p id="site-url-error" role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              {error}
            </p>
          )}
        </form>

        <ul className="grid w-full gap-3 sm:grid-cols-3">
          {HOW.map((h) => (
            <li key={h.title} className="flex flex-col gap-1 rounded-lg border p-4">
              <b className="text-sm">{h.title}</b>
              <span className="text-[13px] text-muted-foreground">{h.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </AuditShell>
  );
}
