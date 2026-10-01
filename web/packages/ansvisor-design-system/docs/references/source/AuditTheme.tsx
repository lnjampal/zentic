import { useMemo, useState } from "react";
import {
  Activity, Bell, ChevronDown, ChevronRight, CircleHelp, Clock3, Download,
  ExternalLink, FileSearch, Filter, Globe2, LayoutDashboard, ListChecks,
  MoreHorizontal, Search, Settings2, ShieldCheck, Sparkles, X,
} from "lucide-react";

type Finding = { title: string; detail: string; url: string; priority: "Critical" | "Warning" | "Notice"; group: string; count: number };

const findings: Finding[] = [
  { title: "AI crawler blocked by robots.txt", detail: "Review crawler rules and allow only the bots you want to access these pages.", url: "/guides/getting-started", priority: "Critical", group: "Crawler access", count: 8 },
  { title: "Key pages lack structured data", detail: "Add relevant schema so page entities and details are easier for machines to interpret.", url: "/services/consulting", priority: "Critical", group: "Machine readability", count: 23 },
  { title: "Important answers are hidden in scripts", detail: "Render essential content in crawlable HTML where possible.", url: "/help/booking", priority: "Warning", group: "Content access", count: 14 },
  { title: "Images lack descriptive alternatives", detail: "Add meaningful alternative text to important visual content.", url: "/case-studies/field-notes", priority: "Warning", group: "Content clarity", count: 31 },
  { title: "Orphan page is hard to discover", detail: "Link this page from relevant crawlable pages and check its sitemap entry.", url: "/about/our-method", priority: "Notice", group: "Discoverability", count: 3 },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard }, { label: "AI readiness", icon: ShieldCheck },
  { label: "Rank tracker", icon: Activity }, { label: "Site explorer", icon: Globe2 },
  { label: "Keywords", icon: Search }, { label: "Reports", icon: FileSearch },
];

function PetalMark() {
  return <span className="ans-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function TrendChart() {
  return <svg className="trend-svg" viewBox="0 0 640 174" role="img" aria-label="Audit health trend rising from 71 to 78">
    <defs><linearGradient id="auditFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#729db4" stopOpacity=".22" /><stop offset="1" stopColor="#729db4" stopOpacity="0" /></linearGradient></defs>
    {[30, 70, 110, 150].map(y => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#e7dcd0" strokeDasharray="3 5" />)}
    <path d="M0 126 C26 117 42 120 64 112 S104 115 128 94 S166 102 192 88 S232 98 256 77 S300 82 320 70 S358 83 384 57 S420 65 448 48 S492 65 512 43 S550 54 576 30 S615 41 640 17 V174 H0Z" fill="url(#auditFill)" />
    <path d="M0 126 C26 117 42 120 64 112 S104 115 128 94 S166 102 192 88 S232 98 256 77 S300 82 320 70 S358 83 384 57 S420 65 448 48 S492 65 512 43 S550 54 576 30 S615 41 640 17" fill="none" stroke="#729db4" strokeWidth="3" strokeLinecap="round" />
    <circle cx="640" cy="17" r="5" fill="#729db4" stroke="#fff" strokeWidth="3" />
  </svg>;
}

export function AuditTheme() {
  const [filter, setFilter] = useState("All issues");
  const [activeNav, setActiveNav] = useState("AI readiness");
  const [tab, setTab] = useState("Issues");
  const [notice, setNotice] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [toast, setToast] = useState("");
  const [range, setRange] = useState("30 days");
  const visibleFindings = useMemo(() => findings.filter(f => filter === "All issues" || f.priority === filter), [filter]);
  const actionToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  return <div className="ans-app">
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
      .ans-app{--ink:#182d45;--muted:#697b8e;--line:#dce6ef;--canvas:#f3f7fb;--paper:#fff;--forest:#1f5c9f;--lime:#ff963f;--soft:#e9f2fc;min-height:100vh;background:var(--canvas);color:var(--ink);font:14px/1.45 'DM Sans',sans-serif;display:flex;overflow:hidden}
      .ans-app *{box-sizing:border-box}.ans-app button{font:inherit;color:inherit;cursor:pointer}.ans-app button:focus-visible{outline:2px solid #3478c5;outline-offset:2px}
      .ans-side{width:238px;flex:0 0 238px;background:#163553;color:#e1edf9;display:flex;flex-direction:column;min-height:100vh;padding:22px 13px 16px;position:relative;z-index:5}
      .ans-brand{height:44px;padding:0 11px;display:flex;align-items:center;gap:11px;color:#f7fbff;font:800 21px 'Manrope',sans-serif;letter-spacing:-.8px}.ans-mark{position:relative;width:22px;height:22px;display:inline-block;flex:none}.ans-mark i{position:absolute;width:8px;height:8px;background:#ff963f;border-radius:8px 8px 2px 8px;transform:rotate(-45deg)}.ans-mark i:nth-child(1){left:1px;top:2px}.ans-mark i:nth-child(2){right:1px;top:2px;transform:rotate(45deg)}.ans-mark i:nth-child(3){left:1px;bottom:2px;transform:rotate(-135deg)}.ans-mark i:nth-child(4){right:1px;bottom:2px;transform:rotate(135deg)}
      .ans-workspace{margin:20px 5px 18px;border:1px solid #345575;background:#1c4267;border-radius:9px;padding:10px;display:flex;align-items:center;gap:9px;text-align:left;color:#edf5fc;width:calc(100% - 10px)}.ans-workspace .workspace-dot{height:25px;width:25px;border-radius:7px;background:#ffbd84;color:#273b50;font-weight:700;display:grid;place-items:center;font-size:11px}.ans-workspace span:nth-child(2){min-width:0;flex:1}.ans-workspace b{font-size:12px;display:block}.ans-workspace small{color:#b4c8da;font-size:10px}
      .ans-overline{font:500 9px 'DM Mono',monospace;letter-spacing:1.35px;color:#a6bfd7;padding:0 11px 8px;text-transform:uppercase}.ans-nav{display:grid;gap:3px}.ans-nav button{height:39px;border:0;background:transparent;color:#c0d1e0;border-radius:7px;text-align:left;padding:0 11px;display:flex;align-items:center;gap:12px;font-size:12px;transition:background .18s,color .18s}.ans-nav button:hover{background:#264c70;color:#fff}.ans-nav button.selected{background:#ff963f;color:#173553;font-weight:700}.ans-nav svg{width:16px;height:16px}.ans-nav .nav-count{margin-left:auto;font:10px 'DM Mono',monospace}.ans-side-spacer{flex:1}.ans-side-note{margin:10px 5px 12px;border:1px solid #345575;background:#1a3d60;border-radius:9px;padding:12px}.ans-side-note small{color:#b4c8da;font-size:10px}.ans-side-note strong{display:block;color:#f5f9fd;font:700 12px 'Manrope',sans-serif;margin:4px 0 10px}.ans-side-note button{background:var(--lime);border:0;border-radius:5px;color:#263b51;padding:7px 9px;font-size:10px;font-weight:700}.ans-side-bottom{border-top:1px solid #345575;padding-top:13px;display:flex;align-items:center;gap:9px;color:#d5e2ee;font-size:11px}.ans-avatar{width:27px;height:27px;border-radius:50%;background:#bfd6ef;color:#1d405f;display:grid;place-items:center;font-weight:700;font-size:10px}.ans-side-bottom span:nth-child(2){flex:1}.ans-side-bottom small{display:block;color:#a9c0d5;font-size:9px}
      .ans-main{flex:1;min-width:0}.ans-topbar{height:58px;background:var(--paper);border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 34px;gap:18px}.ans-crumb{font-size:11px;color:var(--muted);display:flex;gap:8px;align-items:center}.ans-crumb strong{color:var(--ink);font-weight:600}.ans-top-actions{margin-left:auto;display:flex;gap:9px;align-items:center}.ans-iconbtn{width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--line);border-radius:7px;background:transparent;color:#64736a;position:relative}.ans-iconbtn svg{width:15px;height:15px}.ans-iconbtn:hover{background:#f0f2e9}.ans-ping{position:absolute;width:6px;height:6px;border-radius:50%;background:#d78552;top:6px;right:6px;border:1px solid #fbfcf7}.ans-top-user{width:26px;height:26px;background:#d8c5a4;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:700;margin-left:4px}
      .ans-content{max-width:1320px;padding:27px 34px 45px;margin:auto}.ans-mobile-toggle{display:none}.ans-page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:22px}.ans-eyebrow{font:500 9px 'DM Mono',monospace;letter-spacing:1.3px;color:#72806d;text-transform:uppercase;display:flex;align-items:center;gap:7px}.ans-eyebrow:before{content:'';width:7px;height:7px;border-radius:50%;background:#a1bf60}.ans-page-heading h1{font:700 27px/1.15 'Manrope',sans-serif;letter-spacing:-1px;margin:7px 0 5px}.ans-subtitle{font-size:12px;color:var(--muted)}.ans-subtitle strong{color:#34483b;font-weight:600}.ans-heading-actions{display:flex;align-items:center;gap:8px;padding-top:13px}.ans-button{border:1px solid #dce1d6;background:var(--paper);border-radius:6px;padding:8px 11px;font-size:11px;font-weight:600;display:inline-flex;gap:7px;align-items:center;white-space:nowrap}.ans-button svg{width:13px;height:13px}.ans-button:hover{border-color:#9eae8b;background:#fff}.ans-button.primary{background:#304b3b;color:white;border-color:#304b3b}.ans-button.primary:hover{background:#3b5d47}
      .ans-sample{background:#edf1e5;border:1px solid #dce5cb;border-radius:6px;padding:9px 12px;margin-bottom:17px;display:flex;align-items:center;gap:9px;color:#5c6e55;font-size:10px}.ans-sample svg{width:14px;height:14px;flex:none;color:#718e4d}.ans-sample b{color:#354b38}.ans-sample span{flex:1}.ans-sample button{border:0;background:none;padding:2px;color:#7c8972}.ans-sample button svg{color:inherit;width:14px}
      .ans-sitebar{display:flex;align-items:center;gap:11px;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:10px 13px;margin-bottom:14px}.ans-siteicon{width:29px;height:29px;border-radius:7px;background:#e8eee0;display:grid;place-items:center;color:#57714b}.ans-siteicon svg{width:15px;height:15px}.ans-siteinfo{min-width:0;flex:1}.ans-siteinfo strong{font-size:12px;display:block}.ans-siteinfo span{font:10px 'DM Mono',monospace;color:#7b877d}.ans-tag{border-radius:20px;padding:4px 8px;background:#eff3e8;color:#60744e;font-size:9px;font-weight:700}.ans-site-meta{color:#7b877d;font-size:10px;display:flex;align-items:center;gap:5px}.ans-site-meta svg{width:12px;height:12px}
      .ans-metrics{display:grid;grid-template-columns:1.3fr repeat(3,1fr);gap:11px;margin-bottom:14px}.ans-metric{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:15px 16px;min-height:111px;position:relative;overflow:hidden}.ans-metric.score{background:#304b3b;color:#f3f3e9;border-color:#304b3b}.ans-metric-label{font-size:10px;color:#758078;display:flex;align-items:center;gap:5px}.score .ans-metric-label{color:#c1d0be}.ans-metric-label svg{width:12px;height:12px}.ans-metric-val{font:700 27px/1 'Manrope',sans-serif;letter-spacing:-1px;margin-top:12px}.ans-metric-val small{font:500 11px 'DM Sans',sans-serif;color:#8d998d;letter-spacing:0}.score .ans-metric-val{color:#d5e99a;font-size:30px}.ans-metric-foot{margin-top:9px;font-size:9px;color:#7f8a80;display:flex;align-items:center;gap:5px}.score .ans-metric-foot{color:#b6c5b3}.metric-up{color:#608348;font-weight:700}.score .metric-up{color:#d3e99a}.ans-spark{position:absolute;right:14px;bottom:15px;width:71px;height:25px}
      .ans-grid-main{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(270px,.85fr);gap:14px;margin-bottom:14px}.ans-panel{background:var(--paper);border:1px solid var(--line);border-radius:8px;min-width:0}.ans-panel-head{display:flex;align-items:center;justify-content:space-between;padding:15px 17px 10px;gap:10px}.ans-panel-head h2{font:700 13px 'Manrope',sans-serif;margin:0;letter-spacing:-.15px}.ans-panel-head p{font-size:9px;color:#89938a;margin:3px 0 0}.ans-select{border:1px solid var(--line);background:transparent;color:#647168;border-radius:5px;padding:6px 8px;font-size:9px;display:flex;align-items:center;gap:7px}.ans-select svg{width:11px;height:11px}.ans-chart-wrap{padding:5px 18px 0}.trend-svg{width:100%;height:164px;overflow:visible}.ans-chart-labels{display:flex;justify-content:space-between;padding:0 1px 11px;color:#929b91;font:9px 'DM Mono',monospace}.ans-chart-bottom{border-top:1px solid #edf0e8;padding:10px 17px;display:flex;align-items:center;gap:18px;color:#718074;font-size:9px}.ans-legend{display:flex;align-items:center;gap:5px}.ans-legend i{width:7px;height:7px;background:#92ae62;border-radius:50%}.ans-chart-bottom .right-note{margin-left:auto;color:#879185}
      .ans-health{padding:0 17px 16px}.ans-health-score{display:flex;align-items:baseline;gap:8px;border-bottom:1px solid #edf0e8;padding:7px 0 13px}.ans-health-score strong{font:700 37px 'Manrope',sans-serif;letter-spacing:-2px}.ans-health-score span{font-size:10px;color:#839087}.ans-health-score em{margin-left:auto;font-size:9px;font-style:normal;color:#728950;background:#edf2e4;border-radius:20px;padding:4px 7px}.ans-breakdown{display:grid;gap:11px;padding-top:14px}.ans-break-row{display:grid;grid-template-columns:73px 1fr 26px;gap:8px;align-items:center;font-size:9px;color:#68756c}.ans-track{height:5px;background:#edf0e8;border-radius:6px;overflow:hidden}.ans-track i{height:100%;display:block;border-radius:6px;background:#9abb68}.ans-break-row:nth-child(2) .ans-track i{background:#d4b265}.ans-break-row:nth-child(3) .ans-track i{background:#d48a65}
      .ans-findings{margin-top:0}.ans-find-head{display:flex;align-items:center;gap:15px;padding:15px 17px 0}.ans-find-head h2{font:700 13px 'Manrope',sans-serif;margin:0}.ans-tabs{display:flex;gap:14px;margin-left:5px}.ans-tabs button{background:none;border:0;color:#89938a;font-size:10px;padding:0 0 10px;border-bottom:2px solid transparent}.ans-tabs button.active{color:#34483b;border-color:#78934f;font-weight:700}.ans-find-tools{margin-left:auto;display:flex;gap:7px;align-items:center}.ans-filter{border:1px solid var(--line);background:#fbfcf7;border-radius:5px;padding:6px 8px;font-size:9px;color:#647168;display:flex;align-items:center;gap:6px}.ans-filter svg{width:12px;height:12px}.ans-find-table{width:100%;border-collapse:collapse}.ans-find-table th{text-align:left;color:#96a097;font:9px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.55px;padding:11px 17px 8px;border-bottom:1px solid #edf0e8}.ans-find-table td{padding:11px 17px;border-bottom:1px solid #eff1ea;vertical-align:middle}.ans-find-table tr:last-child td{border-bottom:0}.ans-finding-name{display:flex;align-items:center;gap:9px;min-width:210px}.ans-severity{width:6px;height:25px;border-radius:5px;background:#d17458;flex:none}.ans-severity.warning{background:#d5aa58}.ans-severity.notice{background:#8ca775}.ans-finding-name b{display:block;font-size:10px;font-weight:600}.ans-finding-name small{display:block;color:#89938a;font-size:9px;margin-top:3px}.ans-issue-count{font:10px 'DM Mono',monospace;color:#34483b}.ans-url{font:10px 'DM Mono',monospace;color:#758178;white-space:nowrap}.ans-priority{font-size:9px;font-weight:700;display:inline-flex;border-radius:4px;padding:4px 6px;background:#fae9e2;color:#a3543d}.ans-priority.warning{background:#f6f0df;color:#98763a}.ans-priority.notice{background:#eaf0e4;color:#617c4c}.ans-row-action{border:0;background:transparent;color:#7e897f;padding:4px}.ans-row-action svg{width:14px;height:14px}.ans-row-expand{background:#f4f6ee}.ans-row-expand td{padding:0 17px 12px 32px;font-size:10px;color:#66736a}.ans-row-expand p{margin:0 0 8px}.ans-row-expand button{border:0;background:#e6edd9;color:#516b3e;border-radius:4px;padding:5px 8px;font-size:9px;font-weight:600}
      .ans-table-foot{border-top:1px solid #edf0e8;padding:10px 17px;display:flex;justify-content:space-between;align-items:center;color:#89938a;font-size:9px}.ans-table-foot button{border:0;background:transparent;color:#596d4c;font-size:9px;font-weight:700;display:flex;align-items:center;gap:5px}.ans-table-foot svg{width:11px;height:11px}
      .ans-toast{position:fixed;z-index:20;bottom:22px;left:50%;transform:translateX(-50%);background:#294236;color:#eef3e8;border-radius:7px;padding:10px 14px;font-size:11px;box-shadow:0 8px 30px #233a2f38;animation:ansIn .2s ease-out}@keyframes ansIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
      @media(max-width:1050px){.ans-side{width:202px;flex-basis:202px}.ans-content{padding-left:24px;padding-right:24px}.ans-topbar{padding:0 24px}.ans-metrics{grid-template-columns:repeat(4,1fr)}.ans-grid-main{grid-template-columns:minmax(0,1.4fr) minmax(245px,.8fr)}}
      @media(max-width:780px){.ans-app{display:block;overflow:visible}.ans-side{position:fixed;left:0;top:0;bottom:0;width:260px;min-height:100dvh;transform:translateX(-100%);transition:transform .22s ease;box-shadow:12px 0 28px #1d2d2920}.ans-side.mobile-open{transform:translateX(0)}.ans-topbar{height:54px;padding:0 17px}.ans-mobile-toggle{display:grid;place-items:center;width:30px;height:30px;background:none;border:0;color:#506258}.ans-crumb{font-size:10px}.ans-content{padding:22px 17px 36px}.ans-page-heading{display:block}.ans-page-heading h1{font-size:25px}.ans-heading-actions{padding-top:14px}.ans-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ans-metric{min-height:101px;padding:13px}.ans-grid-main{grid-template-columns:1fr}.ans-health{padding-bottom:14px}.ans-site-meta{display:none}.ans-find-head{flex-wrap:wrap;gap:10px}.ans-find-tools{margin-left:auto}.ans-find-table thead{display:none}.ans-find-table,.ans-find-table tbody,.ans-find-table tr,.ans-find-table td{display:block;width:100%}.ans-find-table tr:not(.ans-row-expand){position:relative;padding:12px 42px 11px 0;border-bottom:1px solid #eff1ea}.ans-find-table td{padding:2px 15px;border:0}.ans-find-table td:first-child{padding-left:15px}.ans-find-table td:nth-child(2),.ans-find-table td:nth-child(3){display:inline-block;width:auto;padding-top:7px;padding-left:30px}.ans-find-table td:nth-child(4){position:absolute;right:12px;top:10px;padding:0}.ans-find-table .ans-finding-name{min-width:0}.ans-find-table .ans-row-expand{display:block;padding:0 0 12px}.ans-find-table .ans-row-expand td{padding-left:30px}.ans-find-head h2{width:100%}.ans-tabs{margin:0}.ans-find-tools{margin-left:auto}.ans-table-foot{gap:8px}.ans-table-foot span{max-width:64%}}
      @media(max-width:430px){.ans-content{padding:18px 12px 30px}.ans-topbar{padding:0 12px}.ans-heading-actions .ans-button{padding:8px;font-size:10px}.ans-page-heading h1{font-size:23px}.ans-metric-val{font-size:24px}.ans-metric.score .ans-metric-val{font-size:28px}.ans-spark{width:52px;opacity:.75}.ans-find-head{padding-left:12px;padding-right:12px}.ans-find-tools{width:100%;justify-content:flex-end}.ans-find-head h2{width:auto}.ans-tabs{margin-left:auto}.ans-sample{align-items:flex-start}.ans-sample span{line-height:1.4}.ans-chart-bottom{gap:9px}.ans-chart-bottom .right-note{display:none}}
      .ans-topbar{background:#fff;border-color:#e1e9f1}.ans-iconbtn:hover,.ans-button:hover{background:#f3f8fd}.ans-mobile-toggle{color:#315d88!important}
      .ans-eyebrow{color:#567796}.ans-eyebrow:before{background:#ff963f}.ans-subtitle strong{color:#1f5c9f}
      .ans-sample{background:#edf5fd;border-color:#d4e4f3;color:#496987}.ans-sample svg{color:#3478c5}.ans-sample b{color:#214f7d}.ans-sample button{color:#6c8297}
      .ans-siteicon{background:#e9f2fb;color:#3478c5}.ans-siteinfo span,.ans-site-meta{color:#71869a}.ans-tag{background:#fff1e5;color:#a85a1d}
      .ans-metric.score{background:#1f5c9f;border-color:#1f5c9f;color:#f6faff}.score .ans-metric-val{color:#ffbd84}.score .metric-up{color:#ffbd84}
      .metric-up{color:#3478c5}.ans-metric-label{color:#718196}.ans-metric-foot{color:#7d8da0}.score .ans-metric-label,.score .ans-metric-foot{color:#c5dbf0}
      .ans-chart-bottom{border-color:#eaf0f6;color:#647b92}.ans-legend i{background:#3478c5!important}.ans-chart-bottom .right-note{color:#8193a6}
      .ans-break-row:nth-child(1) .ans-track i{background:#3478c5}.ans-break-row:nth-child(2) .ans-track i{background:#ffad63}.ans-break-row:nth-child(3) .ans-track i{background:#dd775f}
      .ans-tabs button.active{color:#1f5c9f;border-color:#ff963f}.ans-filter{background:#fff;border-color:#dce6ef;color:#526b82}
      .ans-row-expand{background:#f2f7fc}.ans-row-expand button{background:#e5eff9;color:#285f99}.ans-table-foot button{color:#2865a0}
      .ans-toast{background:#173553;box-shadow:0 8px 30px #17355324}
      .ans-button.primary{background:#1f5c9f;border-color:#1f5c9f}.ans-button.primary:hover{background:#174c87}
      .ans-chart-bottom .ans-legend:nth-child(2) i{background:#f3c087!important}
      .ans-health-score em{background:#eaf3fc;color:#2872bd}
      .ans-priority.notice{background:#eaf2fb;color:#2865a0}.ans-severity.notice{background:#5790c9}
      .ans-row-expand button:hover{background:#d7e7f6}
      .ans-app{--ink:#172f4b;--muted:#65768b;--line:#e4ded2;--canvas:#f6f2e9;--paper:#fffdf8;--soft:#eceff2;color:var(--ink)}
      .ans-side{background:#173653}
      .ans-workspace,.ans-side-note{border-color:#315273;background:#1d4162}
      .ans-overline{color:#b4c7d8}
      .ans-nav button{color:#c7d6e2}
      .ans-nav button:hover{background:#264967;color:#fff}
      .ans-nav button.selected{background:#ff963f;color:#183754}
      .ans-side-bottom{border-color:#315273}
      .ans-content{color:#172f4b}
      .ans-topbar{background:#fffdf8;border-color:#e4ded2}
      .ans-page-heading h1,.ans-panel-head h2,.ans-find-head h2,.ans-crumb strong{color:#172f4b}
      .ans-eyebrow{color:#526e8a}
      .ans-subtitle strong{color:#173f67}
      .ans-sitebar,.ans-metric,.ans-panel{background:#fffdf8}
      .ans-sample{background:#f0f4f6;border-color:#d8e0e4;color:#4d657b}
      .ans-sample b{color:#173f67}
      .ans-siteicon{background:#e7eef1;color:#326f9f}
      .ans-metric.score{background:#1f5c9f;border-color:#1f5c9f}
      .ans-find-table th,.ans-find-table td{border-color:#eee8dc}
      .ans-row-expand{background:#f4f1e9}
      .ans-button{border-color:#e4ded2}
      .ans-filter,.ans-select{border-color:#e4ded2;background:#fffdf8}
      .ans-iconbtn{border-color:#e4ded2}
       /* Primary workspace navigation sits at the top, not in a vertical rail. */
       .ans-app{display:block;overflow:visible}
       .ans-side{width:auto;min-height:0;flex:none;position:relative;z-index:5;padding:10px 22px;display:flex;flex-direction:row;align-items:center;gap:13px;background:#173653;color:#e1edf9}
       .ans-brand{height:38px;flex:none;padding:0 3px 0 0}
       .ans-workspace{width:188px;flex:none;margin:0;padding:7px 9px}
       .ans-overline,.ans-side-spacer,.ans-side-note{display:none}
       .ans-nav{display:flex;align-items:center;gap:3px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}
       .ans-nav::-webkit-scrollbar{display:none}
       .ans-nav button{height:38px;flex:none;white-space:nowrap;padding:0 10px;gap:7px}
       .ans-nav button.selected{background:#ff963f;color:#183754}
       .ans-side-bottom{flex:none;margin-left:auto;border:0;padding:0 0 0 5px}
       .ans-main{width:100%;min-width:0}
       .ans-topbar{height:50px;padding:0 30px}
       .ans-mobile-toggle{display:none!important}
       @media(max-width:1180px){
         .ans-side{padding-left:18px;padding-right:18px;gap:10px}
         .ans-workspace{width:168px}
         .ans-nav button{padding:0 8px;gap:6px;font-size:11px}
       }
       @media(max-width:980px){
         .ans-workspace{display:none}
         .ans-nav{margin-left:4px}
       }
       @media(max-width:780px){
         .ans-side{position:relative;inset:auto;width:auto;min-height:0;transform:none;box-shadow:none;display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:0;padding:9px 12px 0}
         .ans-brand{height:35px;flex:1;padding:0}
         .ans-side-bottom{margin-left:auto;padding:0}
         .ans-side-bottom>span:nth-child(2),.ans-side-bottom>svg{display:none}
         .ans-nav{order:3;flex:0 0 calc(100% + 24px);width:calc(100% + 24px);margin:7px -12px 0;padding:0 12px 8px;gap:5px}
         .ans-nav button{height:34px;padding:0 10px;font-size:11px}
         .ans-topbar{height:48px;padding:0 14px}
         .ans-content{padding:22px 17px 36px}
       }
       @media(max-width:430px){
         .ans-side{padding-left:12px;padding-right:12px}
         .ans-nav{flex-basis:calc(100% + 24px);width:calc(100% + 24px)}
         .ans-content{padding:18px 12px 30px}
       }
         /* Light, crisp blue palette with dark ink for contrast. */
         .ans-app{--ink:#1c3852;--muted:#627c93;--line:#dbe7f0;--canvas:#f3f8fc;--paper:#fff;--forest:#347db5;--lime:#ff963f;--soft:#eaf3fa;color:var(--ink)}
         .ans-app button:focus-visible{outline-color:#367db5}
         .ans-side{background:#e4f1fa;color:#1e4565}
         .ans-brand{color:#1e4565}
         .ans-workspace,.ans-side-note{border-color:#c5ddeb;background:#f3f9fd}
         .ans-app .ans-workspace{color:#1e4565}
         .ans-workspace small,.ans-side-bottom small{color:#56758d}
         .ans-workspace .workspace-dot{background:#ffbd84;color:#1e4565}
         .ans-overline{color:#52738d}
         .ans-nav button{color:#2d5575}
         .ans-nav button:hover{background:#d1e7f5;color:#173e5d}
         .ans-nav button.selected{background:#ff963f;color:#263e51}
         .ans-side-note button{color:#263e51}
         .ans-side-bottom{border-color:#c5ddeb;color:#1e4565}
         .ans-avatar{background:#cce3f2;color:#1c4c70}
         .ans-topbar{background:#fff;border-color:#dbe7f0}
         .ans-crumb strong,.ans-page-heading h1,.ans-panel-head h2,.ans-find-head h2{color:#1c3852}
         .ans-iconbtn{color:#56738b}
         .ans-iconbtn:hover,.ans-button:hover{background:#f0f7fc}
         .ans-mobile-toggle{color:#32678d!important}
         .ans-eyebrow{color:#547995}
        .ans-eyebrow:before{background:#ff963f}
         .ans-subtitle strong{color:#245c87}
         .ans-button{border-color:#dbe7f0;color:#365a77}
         .ans-button.primary{background:#cbe5f7;border-color:#a7cfeb;color:#174b72}
         .ans-button.primary:hover{background:#b7dbf2}
         .ans-sample{background:#ebf5fc;border-color:#d2e7f5;color:#486b86}
         .ans-sample svg{color:#367db5}
         .ans-sample b{color:#24577c}
         .ans-sample button{color:#627f95}
         .ans-siteicon{background:#e7f2fa;color:#367db5}
         .ans-siteinfo span,.ans-site-meta{color:#71889a}
        .ans-tag{background:#fff1e5;color:#a85a1d}
         .ans-metric.score{background:#dceefa;border-color:#bddcf0;color:#1c4363}
         .score .ans-metric-val{color:#183e60}
         .score .metric-up{color:#245f8c}
         .metric-up{color:#286f9f}
         .ans-metric-label{color:#6b8296}
         .ans-metric-foot{color:#758ba0}
         .score .ans-metric-label,.score .ans-metric-foot{color:#496d89}
         .ans-chart-bottom{border-color:#e4edf5;color:#607c93}
         .ans-chart-bottom .right-note{color:#8195a6}
         .ans-legend i{background:#367db5!important}
         .ans-break-row:nth-child(1) .ans-track i{background:#65a6d4}
        .ans-break-row:nth-child(2) .ans-track i{background:#ffad63}
        .ans-break-row:nth-child(3) .ans-track i{background:#d48a65}
         .ans-tabs button.active{color:#245c87;border-color:#ff963f}
         .ans-filter{background:#fff;border-color:#dbe7f0;color:#58738a}
         .ans-row-expand{background:#f0f7fc}
         .ans-row-expand button{background:#e1f0fa;color:#245c87}
         .ans-row-expand button:hover{background:#d1e7f5}
         .ans-table-foot button{color:#245c87}
         .ans-toast{background:#245779;box-shadow:0 8px 30px #24577924}
         .ans-health-score em{background:#e5f3fc;color:#286b99}
         .ans-priority.notice{background:#e5f1fa;color:#286b99}
         .ans-severity.notice{background:#76acd0}
         .ans-chart-bottom .ans-legend:nth-child(2) i{background:#dceaf3!important}
         .ans-select{color:#617d93}
         .ans-find-table th,.ans-find-table td{border-color:#e6edf3}
         .ans-find-table th{color:#8195a5}
         .ans-find-table td{color:#36536c}
         .ans-issue-count{color:#245c87}
         .ans-url{color:#71889b}
         .ans-row-action{color:#71899b}
         .ans-find-table .ans-row-expand td{color:#607b91}
          .ans-find-head h2{color:#1c3852}
          /* Shared product palette: warm ivory, plum, coral, and jade. */
          .ans-app{--ink:#311c35;--muted:#756875;--line:#e7dcd0;--canvas:#f7f1e7;--paper:#fffaf2;--forest:#48284c;--lime:#f36e57;--soft:#eee3eb}
          .ans-side{background:#351b36;color:#fff7ef}
          .ans-brand,.ans-side-bottom,.ans-app .ans-workspace{color:#fff7ef}
          .ans-workspace,.ans-side-note{background:#48284c;border-color:#694a68}
          .ans-workspace small,.ans-side-bottom small{color:#d8c3d1}
          .ans-nav button{color:#e4d6e0}
          .ans-nav button:hover{background:#59395b;color:#fff}
          .ans-nav button.selected{background:#f36e57;color:#351b36}
          .ans-topbar,.ans-sitebar,.ans-metric,.ans-panel{background:#fffaf2;border-color:#e7dcd0}
          .ans-page-heading h1,.ans-panel-head h2,.ans-find-head h2,.ans-crumb strong{color:#311c35}
          .ans-eyebrow,.ans-subtitle strong,.ans-table-foot button{color:#317a69}
          .ans-button{color:#48284c;border-color:#d8c5d2;background:#fffaf2}
          .ans-button.primary{background:#48284c;border-color:#48284c;color:#fff}
          .ans-button.primary:hover{background:#351b36}
          .ans-sample{background:#f5e9ed;border-color:#ead7df;color:#655269}
          .ans-sample b{color:#48284c}.ans-sample svg{color:#317a69}
          .ans-siteicon{background:#e1eee7;color:#317a69}
          .ans-metric.score{background:#48284c;border-color:#48284c;color:#fff7ef}
          .score .ans-metric-val,.score .metric-up{color:#ffb69f}
          .score .ans-metric-label,.score .ans-metric-foot{color:#e3d1df}
          .metric-up,.ans-health-score em{color:#317a69}
          .ans-tabs button.active{color:#48284c;border-color:#f36e57}
          .ans-break-row:nth-child(1) .ans-track i,.ans-legend i{background:#317a69!important}
          .ans-row-expand{background:#f6ede8}
          .ans-row-expand button{background:#e1eee7;color:#215b4d}
          .ans-toast{background:#351b36}
          .ans-app button:focus-visible{outline-color:#f36e57}
           /* Align the assessment dashboard with the white, navy, and orange Ansvisor screens. */
           .ans-app{
             --ink:#18364b;--muted:#607887;--line:#dfe8e8;--canvas:#fff;
             --paper:#fff;--forest:#18364b;--lime:#d8753c;--soft:#f2f6f6;
             background:#fff;color:#18364b
           }
           .ans-app button:focus-visible{outline-color:#d8753c}
           .ans-side{background:#fff;color:#18364b;border-bottom:1px solid #dfe8e8}
           .ans-brand,.ans-side-bottom,.ans-app .ans-workspace{color:#18364b}
           .ans-mark i{background:#d8753c}
           .ans-workspace{background:#fff;border-color:#dfe8e8}
           .ans-workspace .workspace-dot,.ans-avatar,.ans-top-user{background:#fff0e6;color:#18364b}
           .ans-workspace small,.ans-side-bottom small{color:#607887}
           .ans-nav button{color:#607887}
           .ans-nav button:hover{background:#fff7f1;color:#18364b}
           .ans-nav button.selected{background:#fff0e6;color:#a94c22}
           .ans-topbar,.ans-sitebar,.ans-metric,.ans-panel{background:#fff;border-color:#dfe8e8}
           .ans-iconbtn,.ans-button,.ans-select,.ans-filter{border-color:#dfe8e8;color:#18364b;background:#fff}
           .ans-iconbtn:hover,.ans-button:hover{background:#fff7f1}
           .ans-ping,.ans-eyebrow:before{background:#d8753c}
           .ans-page-heading h1,.ans-panel-head h2,.ans-find-head h2,.ans-crumb strong{color:#18364b}
           .ans-eyebrow{color:#607887}
           .ans-subtitle strong,.ans-sample b,.ans-table-foot button{color:#18364b}
           .ans-button.primary{background:#d8753c;border-color:#bd5b2a;color:#fff}
           .ans-button.primary:hover{background:#bd5b2a;border-color:#a94c22;color:#fff}
           .ans-sample{background:#fff7f1;border-color:#efc8b0;color:#607887}
           .ans-sample svg,.ans-sample button,.ans-siteicon{color:#bd5b2a}
           .ans-siteicon,.ans-tag{background:#fff0e6}
           .ans-tag{color:#a94c22}
           .ans-metric.score{background:#18364b;border-color:#18364b;color:#fff}
           .score .ans-metric-val,.score .metric-up{color:#f0bd61}
           .score .ans-metric-label,.score .ans-metric-foot{color:#d3e1e6}
           .metric-up,.ans-health-score em{color:#a94c22}
           .ans-health-score em,.ans-priority.notice{background:#fff0e6;color:#a94c22}
           .ans-break-row:nth-child(1) .ans-track i,.ans-legend i{background:#729db4!important}
           .ans-break-row:nth-child(2) .ans-track i{background:#d8753c}
           .ans-tabs button.active{color:#18364b;border-color:#d8753c}
           .ans-row-expand{background:#fff7f1}
           .ans-row-expand button{background:#fff0e6;color:#a94c22}
           .ans-row-expand button:hover{background:#fce4d3}
           .ans-toast{background:#18364b;color:#fff}
    `}</style>
    <aside className="ans-side">
      <div className="ans-brand"><PetalMark />ansvisor</div>
      <button className="ans-workspace" onClick={() => actionToast("Workspace switcher is a visual prototype control.")}><span className="workspace-dot">N</span><span><b>Northstar Studio</b><small>Workspace</small></span><ChevronDown size={14} /></button>
      <div className="ans-overline">Workspace</div>
       <nav className="ans-nav" aria-label="Workspace navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? "selected" : ""} onClick={() => { setActiveNav(label); if (label !== "AI readiness") actionToast(`${label} is shown as a navigation concept.`); }}><Icon /><span>{label}</span>{label === "AI readiness" && <span className="nav-count">01</span>}</button>)}</nav>
      <div className="ans-side-spacer" />
      <div className="ans-side-note"><small>Make your next move</small><strong>Turn findings into fixes.</strong><button onClick={() => actionToast("Recommendations panel is a prototype interaction.")}>View recommendations <ChevronRight size={12} /></button></div>
      <div className="ans-side-bottom"><span className="ans-avatar">MC</span><span>Maya Chen<small>Studio owner</small></span><MoreHorizontal size={16} /></div>
    </aside>
    <main className="ans-main">
      <header className="ans-topbar">
         <div className="ans-crumb"><span>Projects</span><ChevronRight size={12} /><strong>AI readiness</strong></div>
        <div className="ans-top-actions">
          <button className="ans-iconbtn" onClick={() => actionToast("Help center is a visual prototype control.")} aria-label="Help"><CircleHelp /></button>
          <button className="ans-iconbtn" onClick={() => actionToast("You’re all caught up in this sample workspace.")} aria-label="Notifications"><Bell /><i className="ans-ping" /></button>
          <span className="ans-top-user">MC</span>
        </div>
      </header>
      <div className="ans-content">
        <div className="ans-page-heading">
           <div><div className="ans-eyebrow">AI CRAWLER READINESS <span style={{ color: "#a2aba1" }}> / PROJECT 01</span></div><h1>AI readiness report</h1><div className="ans-subtitle">How AI crawlers encounter <strong>northstar.studio</strong> — and what to fix next.</div></div>
          <div className="ans-heading-actions"><button className="ans-button" onClick={() => actionToast("Sample audit report prepared for export.")}><Download /> Export report</button><button className="ans-button primary" onClick={() => actionToast("A fresh crawl cannot be started in this visual prototype.")}><Activity /> Run new crawl</button></div>
        </div>
        {notice && <div className="ans-sample"><Sparkles /><span><b>Illustrative sample workspace</b> — all domain, crawl, and metric details here are fictional and are not connected to Ansvisor data.</span><button onClick={() => setNotice(false)} aria-label="Dismiss sample notice"><X /></button></div>}
        <section className="ans-sitebar">
          <div className="ans-siteicon"><Globe2 /></div><div className="ans-siteinfo"><strong>northstar.studio</strong><span>https://northstar.studio</span></div><span className="ans-tag">SAMPLE PROJECT</span><div className="ans-site-meta"><Clock3 /> Crawled 2 hours ago</div><button className="ans-iconbtn" onClick={() => actionToast("Project settings are a visual prototype control.")} aria-label="Project settings"><Settings2 /></button>
        </section>
        <section className="ans-metrics" aria-label="Audit summary metrics">
           <div className="ans-metric score"><div className="ans-metric-label"><ShieldCheck /> AI readiness score <CircleHelp /></div><div className="ans-metric-val">78<small> / 100</small></div><div className="ans-metric-foot"><span className="metric-up">↑ 4 pts</span> since previous crawl</div><svg className="ans-spark" viewBox="0 0 80 28"><path d="M1 24L12 21L22 22L31 15L41 19L51 11L60 13L70 5L79 2" fill="none" stroke="#f36e57" strokeWidth="2" /></svg></div>
          <div className="ans-metric"><div className="ans-metric-label">Crawled pages <CircleHelp /></div><div className="ans-metric-val">1,284</div><div className="ans-metric-foot"><span className="metric-up">↑ 6.8%</span> vs. last crawl</div><svg className="ans-spark" viewBox="0 0 80 28"><path d="M1 23L12 18L22 20L31 14L41 16L51 10L60 13L70 5L79 3" fill="none" stroke="#9caf83" strokeWidth="2" /></svg></div>
          <div className="ans-metric"><div className="ans-metric-label">Critical issues <CircleHelp /></div><div className="ans-metric-val">12</div><div className="ans-metric-foot"><span className="metric-up">↓ 3 issues</span> since previous crawl</div><svg className="ans-spark" viewBox="0 0 80 28"><path d="M1 4L12 7L22 6L31 13L41 11L51 17L60 14L70 22L79 24" fill="none" stroke="#cf896e" strokeWidth="2" /></svg></div>
           <div className="ans-metric"><div className="ans-metric-label">Crawlable pages <CircleHelp /></div><div className="ans-metric-val">1,216</div><div className="ans-metric-foot"><span className="metric-up">↑ 2.4%</span> sample estimate</div><svg className="ans-spark" viewBox="0 0 80 28"><path d="M1 24L12 20L22 22L31 14L41 18L51 9L60 13L70 7L79 3" fill="none" stroke="#317a69" strokeWidth="2" /></svg></div>
        </section>
        <section className="ans-grid-main">
          <div className="ans-panel">
             <div className="ans-panel-head"><div><h2>AI readiness over time</h2><p>Readiness score across recent sample crawls</p></div><button className="ans-select" onClick={() => setRange(range === "30 days" ? "90 days" : "30 days")}>{range}<ChevronDown /></button></div>
            <div className="ans-chart-wrap"><TrendChart /><div className="ans-chart-labels"><span>May 04</span><span>May 11</span><span>May 18</span><span>May 25</span><span>Jun 02</span></div></div>
             <div className="ans-chart-bottom"><span className="ans-legend"><i /> Readiness score</span><span className="ans-legend"><i style={{ background: "#e7dcd0" }} /> Previous period</span><span className="right-note">Crawl cadence · weekly</span></div>
          </div>
          <div className="ans-panel">
             <div className="ans-panel-head"><div><h2>Readiness breakdown</h2><p>1,284 URLs checked in this sample</p></div><button className="ans-iconbtn" onClick={() => actionToast("Readiness details are part of this sample.")} aria-label="More readiness details"><MoreHorizontal /></button></div>
            <div className="ans-health"><div className="ans-health-score"><strong>78</strong><span>Good standing</span><em>↑ 4.2%</em></div><div className="ans-breakdown">
              <div className="ans-break-row"><span>Healthy</span><div className="ans-track"><i style={{ width: "73%" }} /></div><b>936</b></div>
              <div className="ans-break-row"><span>Warnings</span><div className="ans-track"><i style={{ width: "39%" }} /></div><b>281</b></div>
              <div className="ans-break-row"><span>Errors</span><div className="ans-track"><i style={{ width: "16%" }} /></div><b>67</b></div>
            </div></div>
          </div>
        </section>
        <section className="ans-panel ans-findings">
          <div className="ans-find-head"><h2>Priority findings</h2><div className="ans-tabs">{["Issues", "Crawled pages"].map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
            <div className="ans-find-tools"><select className="ans-filter" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter issues"><option>All issues</option><option>Critical</option><option>Warning</option><option>Notice</option></select><button className="ans-button" onClick={() => actionToast("Advanced filters are available as a prototype control.")}><Filter /> Filters</button></div>
          </div>
          {tab === "Issues" ? <>
            <table className="ans-find-table"><thead><tr><th>Finding</th><th>Pages</th><th>Priority</th><th>Example URL</th><th /></tr></thead><tbody>
              {visibleFindings.map((f, index) => <FragmentRow key={f.title} finding={f} index={index} expanded={expanded === index} onToggle={() => setExpanded(expanded === index ? null : index)} onAction={actionToast} />)}
              {visibleFindings.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#89938a", padding: 24 }}>No findings in this sample priority.</td></tr>}
            </tbody></table><div className="ans-table-foot"><span>Showing {visibleFindings.length} of 76 sample findings</span><button onClick={() => { setFilter("All issues"); actionToast("Showing all illustrative findings."); }}>View all findings <ChevronRight /></button></div>
          </> : <div style={{ padding: "24px 18px", color: "#75817a", fontSize: 11 }}><ListChecks size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Page crawl view is an illustrative tab. Choose Issues to review sample findings.</div>}
        </section>
      </div>
    </main>
    {toast && <div className="ans-toast" role="status">{toast}</div>}
  </div>;
}

function FragmentRow({ finding, index, expanded, onToggle, onAction }: { finding: Finding; index: number; expanded: boolean; onToggle: () => void; onAction: (message: string) => void }) {
  const level = finding.priority.toLowerCase();
  return <>
    <tr onClick={onToggle} style={{ cursor: "pointer" }}>
      <td><div className="ans-finding-name"><span className={`ans-severity ${level}`} /><span><b>{finding.title}</b><small>{finding.group} · sample finding</small></span></div></td>
      <td><span className="ans-issue-count">{finding.count}</span></td><td><span className={`ans-priority ${level}`}>{finding.priority}</span></td><td><span className="ans-url">{finding.url}</span></td>
      <td><button className="ans-row-action" onClick={e => { e.stopPropagation(); onAction("Finding options are a prototype interaction."); }} aria-label={`Options for ${finding.title}`}><MoreHorizontal /></button></td>
    </tr>
    {expanded && <tr className="ans-row-expand"><td colSpan={5}><p>{finding.detail} This is fictional audit content for concept review.</p><button onClick={() => onAction(`Opened sample issue details for ${finding.title}.`)}>Inspect finding <ExternalLink size={11} /></button></td></tr>}
  </>;
}