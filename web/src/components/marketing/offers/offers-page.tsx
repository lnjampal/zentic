'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDashed,
  Layers3,
  Menu,
  Minus,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { siteConfig } from '@/config/site';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { Badge } from '@workspace/ansvisor-design-system/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ansvisor-design-system/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ansvisor-design-system/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ansvisor-design-system/components/ui/table';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import {
  boundaries,
  comparison,
  faqs,
  offers,
  steps,
  type Fit,
  type OfferKey,
} from './offers-content';

const sections = [
  { id: 'offers', label: 'Offers' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'why-zentic', label: 'Why Zentic' },
  { id: 'questions', label: 'Questions' },
];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[1.3px] text-muted-foreground',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      {children}
    </div>
  );
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <>
      <Image src="/logo_light.svg" alt="" width={size} height={size} className="shrink-0 dark:hidden" />
      <Image src="/logo_dark.svg" alt="" width={size} height={size} className="hidden shrink-0 dark:block" />
    </>
  );
}

function FitMark({ fit }: { fit: Fit }) {
  if (fit === 'yes')
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Check className="size-4 text-primary" aria-hidden="true" />
        <span className="sr-only md:not-sr-only md:text-xs">Yes</span>
      </span>
    );
  if (fit === 'partial')
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <CircleDashed className="size-4" aria-hidden="true" />
        <span className="sr-only md:not-sr-only md:text-xs">Partly</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Minus className="size-4" aria-hidden="true" />
      <span className="sr-only md:not-sr-only md:text-xs">No</span>
    </span>
  );
}

export function OffersPage({ signedIn = false }: { signedIn?: boolean }) {
  const [openOffer, setOpenOffer] = useState<OfferKey | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const selected = offers.find((o) => o.key === openOffer);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-10 px-4 md:px-[clamp(20px,5.5vw,86px)]">
          <button
            type="button"
            onClick={() => scrollTo('top')}
            className="flex items-center gap-2 rounded-md font-heading text-xl font-extrabold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`${siteConfig.name} home`}
          >
            <Logo />
            {siteConfig.name}
          </button>

          <nav
            aria-label="Main navigation"
            className={cn(
              'hidden items-center gap-7 md:flex',
              mobileMenu &&
                'absolute inset-x-0 top-16 flex flex-col items-stretch gap-0 border-b bg-background px-4 pb-4 shadow-sm md:static md:flex-row md:items-center md:gap-7 md:border-0 md:p-0 md:shadow-none',
            )}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="border-b py-3 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:border-0 md:py-2"
              >
                {s.label}
              </button>
            ))}
            <div className="flex gap-2 pt-3 md:hidden">
              <Button asChild variant="outline" className="flex-1">
                {signedIn ? <Link href="/dashboard">Dashboard</Link> : <Link href="/sign-in">Sign in</Link>}
              </Button>
              <Button asChild className="flex-1">
                <Link href="/audit">Run my free audit</Link>
              </Button>
            </div>
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost">
              {signedIn ? <Link href="/dashboard">Dashboard</Link> : <Link href="/sign-in">Sign in</Link>}
            </Button>
            <Button asChild>
              <Link href="/audit">
                Run my free audit <ArrowRight />
              </Link>
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="ml-auto rounded-full md:hidden"
            aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu((v) => !v)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="top" className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-12 md:px-[clamp(22px,8.5vw,132px)] md:pb-[68px] md:pt-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-9 hidden size-[410px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent))_0,hsl(var(--accent)/0.5)_48%,transparent_69%)] md:block"
          />
          <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.8fr)] md:gap-[5vw]">
            <div>
              <Eyebrow>AI search readiness for small businesses</Eyebrow>
              <h1 className="mb-5 mt-5 max-w-[690px] font-heading text-[clamp(42px,6.4vw,84px)] font-bold leading-[0.98] tracking-[-0.06em] text-foreground">
                Can customers find my business in search and <span className="text-primary">AI?</span>
              </h1>
              <p className="mb-2 max-w-[490px] font-heading text-[clamp(17px,1.8vw,21px)] font-bold leading-snug tracking-tight">
                Zentic goes one step further:
              </p>
              <p className="max-w-[525px] text-[15px] leading-[1.8] text-muted-foreground">
                Can AI find my business, represent my business, talk to my customers — and complete the transaction for my business?
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-6">
                <Button asChild size="lg" className="px-6">
                  <Link href="/audit">
                    Run my free audit <ArrowRight />
                  </Link>
                </Button>
                <Button variant="link" className="px-0 text-foreground" onClick={() => scrollTo('offers')}>
                  See all three offers <ArrowDown />
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.8px] text-muted-foreground before:h-px before:w-8 before:bg-primary">
                Free audit · no card needed
              </div>
            </div>

            {/* Orbit diagram */}
            <div
              className="relative mx-auto grid h-[340px] w-full max-w-[420px] place-items-center md:h-[395px]"
              role="img"
              aria-label="The three Zentic offers work around your website: understand, answer and take action"
            >
              <div className="absolute size-[300px] -rotate-[19deg] rounded-full border border-chart-1/50 md:size-[335px]" />
              <div className="absolute size-[235px] rotate-[31deg] rounded-full border md:size-[265px]" />
              <div className="relative grid size-40 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-lg md:size-44">
                <div className="absolute inset-3 rounded-full border border-secondary-foreground/20" />
                <div className="flex flex-col items-center gap-2">
                  <Logo size={36} />
                  <span className="font-heading text-[15px] font-bold tracking-tight">your website</span>
                </div>
              </div>
              {[
                { o: offers[0], verb: 'Understand', pos: 'left-0 top-0 md:top-16' },
                { o: offers[1], verb: 'Answer', pos: 'right-0 top-0 md:top-[120px]' },
                { o: offers[2], verb: 'Take action', pos: 'bottom-0 left-1/2 -translate-x-1/2 md:bottom-10 md:left-6 md:translate-x-0' },
              ].map(({ o, verb, pos }) => (
                <div key={o.key} className={cn('absolute z-10 min-w-[140px] rounded-xl border bg-card px-4 py-3 shadow-sm', pos)}>
                  <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <o.icon className="size-4" aria-hidden="true" />
                  </span>
                  <b className="mt-2 block font-heading text-[13px] font-bold">{verb}</b>
                  <small className="mt-0.5 block font-mono text-[10px] uppercase text-muted-foreground">{o.name}</small>
                </div>
              ))}
              <span className="absolute bottom-12 right-[22%] size-2.5 rounded-full bg-primary shadow-[0_0_0_7px_hsl(var(--primary)/0.15)]" />
            </div>
          </div>
        </section>

        {/* Strip */}
        <div className="bg-secondary text-secondary-foreground">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 items-center gap-4 px-4 py-5 md:flex md:justify-between md:px-[clamp(22px,8.5vw,132px)]">
            <strong className="col-span-2 font-heading text-[15px] font-bold tracking-tight">
              Get found. Get asked. Get booked.
            </strong>
            {['Get found by AI', 'Answer every customer', 'Book from the chat'].map((label, i) => (
              <div key={label} className="flex items-center gap-2.5">
                <b className="font-mono text-xs font-medium text-chart-4">0{i + 1}</b>
                <span className="text-[13px] text-secondary-foreground/85">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Offers */}
        <section id="offers" className="mx-auto max-w-[1440px] scroll-mt-16 px-4 py-16 md:px-[clamp(22px,8.5vw,132px)] md:py-24">
          <div className="mb-10 grid items-end gap-4 md:grid-cols-[1fr_0.7fr] md:gap-12">
            <div>
              <Eyebrow className="mb-3.5">The Zentic toolkit</Eyebrow>
              <h2 className="max-w-[560px] font-heading text-[clamp(32px,4vw,49px)] font-bold leading-[1.06] tracking-[-0.05em]">
                Start free. Pay only when customers start booking.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
              The audit shows you what AI assistants miss. The chat assistant turns the attention you win into appointments.
              Each one stands on its own.
            </p>
          </div>

          <div className="grid gap-4">
            {offers.map((o) => (
              <article
                key={o.key}
                className="relative grid gap-x-6 gap-y-3 overflow-hidden rounded-xl border bg-card px-5 py-5 transition-[box-shadow,border-color,transform] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:grid-cols-[64px_minmax(200px,0.8fr)_minmax(240px,1fr)_minmax(190px,0.8fr)] md:items-center md:px-7 md:py-6"
              >
                <div className="font-mono text-xs text-muted-foreground md:self-start md:pt-2">{o.number}</div>
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <o.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <small className="font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">{o.tagline}</small>
                    <h3 className="mt-0.5 font-heading text-base font-bold tracking-tight">{o.name}</h3>
                    <Badge variant={o.statusVariant} className="mt-1.5">
                      {o.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="mb-1.5 font-heading text-[15px] font-bold leading-snug tracking-tight">{o.headline}</h4>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{o.description}</p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <span className="text-xs leading-snug text-muted-foreground">{o.audience}</span>
                  <Button variant="link" className="h-auto px-0 text-foreground" onClick={() => setOpenOffer(o.key)}>
                    What’s included <ArrowRight />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-16 bg-muted px-4 py-16 md:px-[clamp(22px,8.5vw,132px)] md:py-20">
          <div className="mx-auto grid max-w-[1176px] items-start gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-[9vw]">
            <div>
              <Eyebrow>One loop, not three tools</Eyebrow>
              <h2 className="mb-4 mt-3.5 font-heading text-[clamp(32px,4vw,48px)] font-bold leading-[1.06] tracking-[-0.05em]">
                Get found. Get asked. Get booked.
              </h2>
              <p className="max-w-[360px] text-sm leading-relaxed text-muted-foreground">
                The questions customers ask your assistant show what your website is missing. Those gaps become the next fixes
                in your audit, so AI has more to recommend you for.
              </p>
            </div>
            <ol className="grid">
              {steps.map((s) => (
                <li key={s.label} className="grid grid-cols-[112px_1fr] gap-4 border-t py-5">
                  <span className="whitespace-nowrap pt-0.5 font-mono text-[11px] font-medium text-foreground">{s.label}</span>
                  <div>
                    <h3 className="mb-1.5 font-heading text-base font-bold">{s.title}</h3>
                    <p className="max-w-[520px] text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mx-auto mt-11 grid max-w-[1176px] overflow-hidden rounded-lg border bg-card md:grid-cols-3">
            {boundaries.map((b, i) => {
              const Icon = [Sparkles, ShieldCheck, Layers3][i];
              return (
                <div key={b.title} className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <b className="flex items-center gap-2 font-heading text-sm font-bold">
                    <Icon className="size-4 text-primary" aria-hidden="true" /> {b.title}
                  </b>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Zentic */}
        <section id="why-zentic" className="mx-auto max-w-[1176px] scroll-mt-16 px-4 py-16 md:py-24">
          <div className="mb-8 grid items-end gap-4 md:grid-cols-[1fr_0.8fr] md:gap-12">
            <div>
              <Eyebrow className="mb-3.5">Why Zentic</Eyebrow>
              <h2 className="max-w-[580px] font-heading text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.06] tracking-[-0.05em]">
                Built for the owner, not the marketing department.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-relaxed text-muted-foreground">
              AI-visibility suites are made for marketing teams with analysts and dollar budgets. Chat tools answer messages
              but can’t tell you whether AI can find you. Zentic connects the two, at a price a small business can pay.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px] font-mono text-[11px] uppercase tracking-[1.3px]">What you get</TableHead>
                  <TableHead className="bg-accent font-heading text-sm font-bold text-accent-foreground">Zentic</TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[1.3px]">AI-visibility suites</TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[1.3px]">Chatbot tools</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.rows.map((r) => (
                  <TableRow key={r.label}>
                    <TableCell className="text-[13px] font-medium">{r.label}</TableCell>
                    <TableCell className="bg-accent/40"><FitMark fit={r.zentic} /></TableCell>
                    <TableCell><FitMark fit={r.suites} /></TableCell>
                    <TableCell><FitMark fit={r.chat} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 max-w-[760px] text-xs leading-relaxed text-muted-foreground">{comparison.note}</p>
        </section>

        {/* CTA */}
        <section className="px-4">
          <div className="relative mx-auto flex max-w-[1176px] flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-primary p-7 text-primary-foreground md:flex-row md:items-center md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-44 right-[21%] size-[300px] rounded-full border border-primary-foreground/15 shadow-[0_0_0_28px_hsl(var(--primary-foreground)/0.04),0_0_0_57px_hsl(var(--primary-foreground)/0.03)]"
            />
            <div className="relative">
              <div className="font-mono text-[11px] uppercase tracking-[1.3px]">Takes about five minutes</div>
              <h2 className="mb-2.5 mt-3 max-w-[540px] font-heading text-[clamp(28px,4vw,43px)] font-bold leading-[1.05] tracking-[-0.05em]">
                Find out what AI says about your business.
              </h2>
              <p className="max-w-[460px] text-sm leading-relaxed">
                Run the free audit, fix the top three issues, and re-audit to see your score move.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="relative px-6">
              <Link href="/audit">
                Run my free audit <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section id="questions" className="mx-auto max-w-[900px] scroll-mt-16 px-4 py-16 md:py-24">
          <div className="mb-7 text-center">
            <Eyebrow className="justify-center">Good to know</Eyebrow>
            <h2 className="mt-3 font-heading text-[32px] font-bold tracking-[-0.05em]">Straight answers.</h2>
          </div>
          <Accordion type="single" collapsible defaultValue="faq-0" className="border-t">
            {faqs.map(([q, a], i) => (
              <AccordionItem key={q} value={`faq-${i}`}>
                <AccordionTrigger className="font-heading text-[15px] font-bold hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="max-w-[710px] text-[13px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-7 text-xs text-muted-foreground md:px-[clamp(22px,5.5vw,86px)]">
          <span className="flex items-center gap-2 font-heading text-base font-extrabold text-foreground">
            <Logo size={22} /> {siteConfig.name}
          </span>
          <span>Get found. Get asked. Get booked.</span>
          <span className="flex gap-4 md:ml-auto">
            <a href={siteConfig.legal.terms} className="hover:text-foreground">Terms</a>
            <a href={siteConfig.legal.privacy} className="hover:text-foreground">Privacy</a>
            <span>&copy; {new Date().getFullYear()} {siteConfig.name}</span>
          </span>
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setOpenOffer(null)}>
        {selected && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <span className="mb-2 grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <selected.icon className="size-5" aria-hidden="true" />
              </span>
              <Eyebrow>
                Offer {selected.number} · {selected.status}
              </Eyebrow>
              <DialogTitle className="font-heading text-[26px] font-bold tracking-[-0.04em]">{selected.name}</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed">{selected.description}</DialogDescription>
            </DialogHeader>
            <ul className="my-1 grid gap-2.5">
              {selected.includes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
            <p className="rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{selected.note}</p>
            <DialogFooter>
              {selected.cta.href ? (
                <Button asChild className="w-full">
                  <Link href={selected.cta.href}>
                    {selected.cta.label} <ArrowRight />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => {
                    setOpenOffer(null);
                    toast.info(selected.cta.prototypeMessage ?? 'Not connected yet.');
                  }}
                >
                  {selected.cta.label} <ArrowRight />
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
