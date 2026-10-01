import { tokens } from '../generated/tokens';
import { Guidelines } from './parts';

export function BrandPage() {
  return <div className="space-y-6">
    <section className="rounded-lg border bg-card p-6 text-card-foreground">
      <div className="flex items-center gap-4"><img src={`${import.meta.env.BASE_URL}ansvisor-mark.svg`} alt="Ansvisor four-petal mark" className="h-12 w-12" /><span className="font-heading text-3xl font-extrabold tracking-tight">ansvisor</span></div>
      <p className="mt-5 text-sm text-muted-foreground">The four-petal orange mark is retained from the selected dashboard, not a new logo concept.</p>
    </section>
    <section className="rounded-lg border p-6">
      <h2 className="mb-3 text-lg font-semibold">Observed visual language</h2>
      <Guidelines items={[
        {kind:'do',text:'Use white surfaces with thin cool borders for report content and navigation.'},
        {kind:'do',text:'Use navy for headings and important data; reserve orange for primary actions and active states.'},
        {kind:'do',text:'Keep sample data and prototype limitations explicitly labeled.'},
      ]} />
    </section>
  </div>;
}

export function SourcePage() {
  return <div className="space-y-6">
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <h2 className="font-heading text-lg font-bold">Audit dashboard reference</h2>
      <p className="mt-2 text-sm text-muted-foreground">This is a retained image of the source mockup. No existing screen has been migrated or restyled by this extraction.</p>
      <img className="mt-5 w-full rounded-lg border" src={`${import.meta.env.BASE_URL}audit-dashboard.jpg`} alt="Selected Ansvisor audit dashboard: white surfaces, navy headings, orange actions, blue data visualization" />
    </div>
    <div className="rounded-lg border p-5">
      <h2 className="font-semibold">Extraction scope</h2>
      <p className="mt-2 text-sm text-muted-foreground">The mockup contains screen-specific markup, rather than an exported component library. Its visual foundations theme the reusable component scaffold shown in this browser. Product navigation, sample data, and report logic remain outside the system.</p>
      <p className="mt-3 text-sm text-muted-foreground">Light mode follows the source. Dark mode is a derived companion. Orange button labels use deeper navy instead of small white labels, and muted text is slightly darker for contrast on soft surfaces. These adjustments do not change existing screens.</p>
    </div>
  </div>;
}

export function ExtractedTypographyPage() {
  return <div className="space-y-5 rounded-lg border bg-card p-6 text-card-foreground">
    <h2 className="text-lg font-bold">Font families</h2>
    <div className="font-heading"><p className="text-xs text-muted-foreground">MANROPE · HEADINGS & NUMERIC EMPHASIS</p><p className="mt-2 text-3xl font-bold tracking-tight">AI readiness report</p></div>
    <div className="font-sans"><p className="text-xs text-muted-foreground">DM SANS · BODY & CONTROLS</p><p className="mt-2 text-base">How AI crawlers encounter your website—and what to fix next.</p></div>
    <div className="font-mono"><p className="text-xs text-muted-foreground">DM MONO · METADATA</p><p className="mt-2 text-sm">AI CRAWLER READINESS / PROJECT 01</p></div>
    <h2 className="pt-4 text-lg font-bold">Source sizes</h2>
    <p className="text-sm text-muted-foreground">Report title 27px / 700 · metric 27–30px / 700 · panel title 13px / 700 · controls 11px / 600 · supporting text 9–12px. The reusable browser also shows a general type scale for larger surfaces.</p>
    <p className="text-sm text-muted-foreground">Body: {tokens.fontFamily.sans.join(', ')} · Base corner radius: {tokens.radius} · Spacing unit: {tokens.spacing}</p>
  </div>;
}