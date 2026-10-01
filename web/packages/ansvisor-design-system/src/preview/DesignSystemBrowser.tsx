import { Suspense, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import {
  ALL_ENTRIES,
  DESIGN_SYSTEM,
  NAV_GROUPS,
  OVERVIEW_ENTRY,
  type NavGroup,
} from './registry';

function readHashId(): string {
  const id = new URLSearchParams(window.location.hash.slice(1)).get('page');
  if (!id) {
    return OVERVIEW_ENTRY.id;
  }
  return ALL_ENTRIES.some((entry) => entry.id === id)
    ? id
    : OVERVIEW_ENTRY.id;
}

function useSelectedId(): [string, (id: string) => void] {
  const [selected, setSelected] = useState(readHashId);

  useEffect(() => {
    const onHashChange = () => setSelected(readHashId());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const select = (id: string) => {
    setSelected(id);
    window.location.hash = new URLSearchParams({ page: id }).toString();
  };

  return [selected, select];
}

function NavigationItems({
  showOverview,
  groups,
  activeId,
  query,
  select,
}: {
  showOverview: boolean;
  groups: NavGroup[];
  activeId: string;
  query: string;
  select: (id: string) => void;
}) {
  return (
    <nav aria-label="Design system navigation" className="flex flex-wrap items-center gap-2 py-3">
      {showOverview ? (
        <Button
          type="button"
          onClick={() => select(OVERVIEW_ENTRY.id)}
          aria-current={OVERVIEW_ENTRY.id === activeId ? 'page' : undefined}
          variant={OVERVIEW_ENTRY.id === activeId ? 'default' : 'ghost'}
        >
          {OVERVIEW_ENTRY.name}
        </Button>
      ) : null}

      {groups.map((group) => (
        <DropdownMenu key={group.name}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={group.entries.some(entry => entry.id === activeId) ? 'default' : 'ghost'}
            >
              {group.name}<ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[60vh] overflow-y-auto">
            {group.entries.map((entry) => (
              <DropdownMenuItem
                key={entry.id}
                onSelect={() => select(entry.id)}
                aria-current={entry.id === activeId ? 'page' : undefined}
              >
                {entry.name}
                {entry.id === activeId ? <Check aria-hidden="true" className="ml-auto" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {!showOverview && groups.length === 0 ? (
        <p className="px-2 py-4 text-sm text-muted-foreground">
          No sections match “{query}”.
        </p>
      ) : null}
    </nav>
  );
}

export function DesignSystemBrowser() {
  const [selectedId, select] = useSelectedId();
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(() => new URLSearchParams(window.location.search).get('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    return () => document.documentElement.classList.remove('dark');
  }, [dark]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        entries: group.name.toLowerCase().includes(normalizedQuery)
          ? group.entries
          : group.entries.filter((entry) =>
              `${entry.name} ${entry.description}`
                .toLowerCase()
                .includes(normalizedQuery),
            ),
      })).filter((group) => group.entries.length > 0),
    [normalizedQuery],
  );

  const active =
    ALL_ENTRIES.find((entry) => entry.id === selectedId) ?? OVERVIEW_ENTRY;
  const activeGroup = NAV_GROUPS.find((group) =>
    group.entries.some((entry) => entry.id === active.id),
  );
  const ActivePage = active.Page;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active.id]);

  const showOverview = `${OVERVIEW_ENTRY.name} ${OVERVIEW_ENTRY.description}`
    .toLowerCase()
    .includes(normalizedQuery);
  const selectPage = (id: string) => {
    select(id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="w-full px-6 sm:px-10">
        <div className="flex flex-wrap items-center gap-4 border-b py-4">
          <div className="mr-auto flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}ansvisor-mark.svg`} alt="Ansvisor" className="h-7 w-7" />
            <p className="font-heading text-sm font-semibold">{DESIGN_SYSTEM.title}</p>
          </div>
          <div className="order-last w-full sm:order-none sm:w-64">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search design system"
              placeholder="Search design system…"
            />
          </div>
          <Button variant="outline" type="button" aria-pressed={dark} onClick={() => setDark(value => !value)}>
            {dark ? 'Derived dark mode' : 'Source light mode'} · Switch
          </Button>
        </div>
          <NavigationItems
            showOverview={showOverview}
            groups={filteredGroups}
            activeId={active.id}
            query={query}
            select={selectPage}
          />
        </div>
      </header>

      <main className="min-w-0 px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full">
          <header className="border-b pb-8">
            {active.id === OVERVIEW_ENTRY.id ? (
              <>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {DESIGN_SYSTEM.title}
                </h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  {DESIGN_SYSTEM.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Extracted from the selected audit dashboard · Existing screens remain unchanged · Dark mode is derived</p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {activeGroup?.name}
                </p>
                <h1 className="mt-2 text-2xl font-semibold">{active.name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {active.description}
                </p>
              </>
            )}
          </header>

          <div className="pt-8">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="rounded-xl border bg-card p-6 text-sm text-muted-foreground"
                >
                  Loading preview…
                </div>
              }
            >
              <ActivePage />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
