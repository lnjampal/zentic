import Image from 'next/image';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';

export const AUDIT_STEPS = ['Website', 'Verify', 'Audit', 'Report'] as const;

export function AuditStepper({ active }: { active: number }) {
  return (
    <ol aria-label="Audit progress" className="flex items-center gap-1.5 md:gap-3">
      {AUDIT_STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={label} className="flex items-center gap-1.5 md:gap-3" aria-current={current ? 'step' : undefined}>
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full border border-secondary text-xs font-bold',
                done || current ? 'bg-secondary text-secondary-foreground' : 'bg-background text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-[13px] sm:inline',
                current ? 'font-bold text-foreground' : done ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
              {done && <span className="sr-only"> (done)</span>}
            </span>
            {i < AUDIT_STEPS.length - 1 && <span aria-hidden="true" className="h-px w-3 bg-border sm:w-5 md:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

export function AuditShell({
  step,
  signedIn,
  children,
}: {
  step: number;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:gap-4 md:gap-8 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md font-heading text-xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span className="sr-only sm:hidden">{siteConfig.name}</span>
            <Image src="/logo_light.svg" alt="" width={28} height={28} className="shrink-0 dark:hidden" />
            <Image src="/logo_dark.svg" alt="" width={28} height={28} className="hidden shrink-0 dark:block" />
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </Link>
          <div className="flex flex-1 justify-center">
            <AuditStepper active={step} />
          </div>
          <Button asChild variant="ghost" className="px-2 sm:px-[11px]">
            {signedIn ? <Link href="/audit/reports">My reports</Link> : <Link href="/sign-in">Sign in</Link>}
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-4 py-6 text-xs text-muted-foreground md:px-12">
          <span>&copy; {new Date().getFullYear()} {siteConfig.name}</span>
          <a href={siteConfig.legal.terms} className="hover:text-foreground">Terms</a>
          <a href={siteConfig.legal.privacy} className="hover:text-foreground">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
