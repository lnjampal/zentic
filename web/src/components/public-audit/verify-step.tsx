'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ansvisor-design-system/components/ui/tabs';
import { verifyClaim, verificationMailto, type PublicClaim, type VerifyMethod } from '@/lib/public-audit';

function CopyBlock({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <code className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-secondary px-3.5 py-3 font-mono text-xs leading-relaxed text-secondary-foreground">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-10"
        aria-label={`Copy ${label}`}
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
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

export function VerifyStep({
  claim,
  startError,
  onVerified,
}: {
  claim: PublicClaim;
  startError: string | null;
  onVerified: (claim: PublicClaim) => void;
}) {
  const [method, setMethod] = useState<VerifyMethod>(claim.verifyMethod ?? 'meta');
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setFailure(null);
    try {
      const result = await verifyClaim(claim.id, method);
      if (result.verified && result.claim) {
        toast.success('Verified. Starting your audit.');
        onVerified(result.claim);
      } else {
        setFailure(result.message);
      }
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : '';
  const fileBlob = `data:text/html;charset=utf-8,${encodeURIComponent(claim.verification.file.content)}`;

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 md:grid-cols-[minmax(0,1fr)_320px] md:px-12">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md border px-2 py-0.5 text-xs font-semibold">{claim.domain}</span>
            <Link href="/audit" className="text-[13px] underline-offset-4 hover:underline">
              Change
            </Link>
          </div>
          <h1 className="font-heading text-[clamp(26px,4vw,32px)] font-bold tracking-[-0.03em]">Prove this site is yours</h1>
          <p className="max-w-[620px] text-muted-foreground">
            This keeps reports private to the owner. Pick one method; it takes about two minutes.
          </p>
        </div>

        {(failure || startError) && (
          <div role="alert" className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
            <b className="text-destructive">{failure ? 'Not verified yet' : 'Verification needed'}</b>
            <span className="text-[13px]">{failure ?? startError}</span>
          </div>
        )}

        <Tabs value={method} onValueChange={(v) => setMethod(v as VerifyMethod)}>
          <TabsList aria-label="Verification method">
            <TabsTrigger value="meta">Meta tag (easiest)</TabsTrigger>
            <TabsTrigger value="dns">DNS record</TabsTrigger>
            <TabsTrigger value="file">HTML file</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="pt-4">
            <ol className="flex list-decimal flex-col gap-4 pl-5">
              <li>
                <b>Copy this tag</b>
                <CopyBlock value={claim.verification.meta} label="meta tag" />
              </li>
              <li>
                <b>Paste it inside the &lt;head&gt; of your home page</b>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  WordPress: use your theme’s or SEO plugin’s “header code” setting. Wix: Settings › Custom code › Head.
                </p>
              </li>
              <li>
                <b>Publish your site, then check</b>
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="dns" className="pt-4">
            <ol className="flex list-decimal flex-col gap-4 pl-5">
              <li>
                <b>Add a TXT record where you manage your domain</b>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Type: TXT · Host or name: {claim.verification.dns.host} · Value:
                </p>
                <CopyBlock value={claim.verification.dns.value} label="TXT record value" />
              </li>
              <li>
                <b>Save it.</b> <span className="text-muted-foreground">DNS changes can take a few minutes to show.</span>
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="file" className="pt-4">
            <ol className="flex list-decimal flex-col gap-4 pl-5">
              <li>
                <b>Download your verification file</b>
                <div className="mt-2">
                  <Button asChild variant="outline">
                    <a href={fileBlob} download={claim.verification.file.name}>
                      Download {claim.verification.file.name}
                    </a>
                  </Button>
                </div>
              </li>
              <li>
                <b>Upload it to your site’s root folder</b>
                <p className="mt-1 text-[13px] text-muted-foreground">It should open at:</p>
                <CopyBlock value={claim.verification.file.url} label="file address" />
              </li>
            </ol>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button size="lg" onClick={check} disabled={checking} className="px-6">
            {checking && <Loader2 className="animate-spin" aria-hidden="true" />}
            {failure ? 'Try again' : 'Check now'}
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={verificationMailto(claim, verifyUrl)}>
              <Mail aria-hidden="true" /> Email these steps to my web person
            </a>
          </Button>
          <span className="text-[13px] text-muted-foreground" aria-live="polite">
            {checking ? 'Checking your site…' : 'Checks in under 10 seconds.'}
          </span>
        </div>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-lg border bg-muted p-5">
        <b className="font-heading text-[15px]">Why we ask</b>
        <p className="text-[13px] text-muted-foreground">
          Only the owner, or someone they trust, should see a site’s full report and history.
        </p>
        <p className="text-[13px] text-muted-foreground">
          We check again before each re-audit. If you remove the tag, the site is no longer verified.
        </p>
        <p className="text-[13px] text-muted-foreground">Keep this page’s link: it brings you back to this step.</p>
      </aside>
    </div>
  );
}
