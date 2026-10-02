'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { dashboardNav, type NavItem } from '@/config/dashboard';
import {
  getDashboardNavLabel,
  getDashboardNavGroupLabel,
  shouldShowDashboardNavItem,
} from '@/lib/dashboard-navigation';
import { useBrandStore } from '@/stores/use-brand-store';
import { useFeatureGate } from '@/hooks/use-feature-gate';
import { useAgentKeyStatus } from '@/hooks/use-agent-key-status';
import { siteConfig } from '@/config/site';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import { Badge } from '@workspace/ansvisor-design-system/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ansvisor-design-system/components/ui/dropdown-menu';
import { BrandSwitcher } from '@/components/layout/brand-switcher';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserMenu } from '@/components/layout/user-profile-nav-item';
import { ChevronDown, ChevronRight, Crown } from 'lucide-react';

/**
 * Top navigation (replaces the left sidebar), following the design system's
 * reference dashboard: logo · brand switcher · menu · profile on one bar, and a
 * breadcrumb strip beneath it. Ungrouped nav items render as top-level links;
 * titled groups (Analytics, Optimization) render as dropdown menus so the bar
 * fits on one line. The same `dashboardNav` config drives this and MobileNav.
 */
export function TopNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tBrands = useTranslations('brands');
  const { canUse, requiredPlanFor, isCloud } = useFeatureGate();
  const agentKeyStatus = useAgentKeyStatus(isCloud);
  const agentKeyMissing = isCloud && agentKeyStatus === 'missing';
  const activeBrand = useBrandStore((s) => s.brands.find((b) => b.id === s.activeBrandId) ?? null);
  const hasBrands = useBrandStore((s) => s.brands.length > 0);
  const brandPrefs = { shoppingModeEnabled: !!activeBrand?.shoppingModeEnabled };
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Hydration guard: the resolved theme is unknown during SSR (see sidebar history).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg';

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
  const label = (item: NavItem) => getDashboardNavLabel(item.title, t, tBrands);
  const badgeFor = (item: NavItem) =>
    item.href === '/dashboard/agent' && agentKeyMissing ? 'Set up' : item.badge;
  const isLocked = (item: NavItem) =>
    isCloud && item.requiredFeature != null && !canUse(item.requiredFeature);

  // Breadcrumb: the group (if any) and the current page.
  let crumbGroup: string | null = null;
  let crumbPage: string | null = null;
  for (const group of dashboardNav) {
    const hit = group.items.find((i) => isActive(i.href));
    if (hit) {
      crumbGroup = group.title ? getDashboardNavGroupLabel(group.title, t) : null;
      crumbPage = label(hit);
      break;
    }
  }
  if (!crumbPage && pathname.startsWith('/dashboard/settings')) crumbPage = t('settings');

  const itemClass = (active: boolean) =>
    cn(
      'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      active
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
    );

  return (
    <header className="shrink-0 border-b bg-card">
      {/* Main bar */}
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <MobileNav />
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <Image
            src={logoSrc}
            alt={siteConfig.name}
            width={28}
            height={28}
            className="h-7 w-7 shrink-0"
            priority
          />
          <span className="font-heading text-lg font-bold tracking-tight">{siteConfig.name}</span>
        </Link>

        <div className={cn('ml-2 hidden w-56 shrink-0 rounded-lg md:block', hasBrands && 'border')}>
          <BrandSwitcher />
        </div>

        <nav className="ml-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {dashboardNav.map((group, gi) => {
            const items = group.items.filter((i) => shouldShowDashboardNavItem(i, brandPrefs));
            if (items.length === 0) return null;

            if (!group.title) {
              return items.map((item) => {
                const badge = badgeFor(item);
                if (isLocked(item)) {
                  return (
                    <span
                      key={item.href}
                      className={cn(itemClass(false), 'cursor-not-allowed opacity-50')}
                      title={`${label(item)} (${requiredPlanFor(item.requiredFeature!)})`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {label(item)}
                    </span>
                  );
                }
                return (
                  <Link key={item.href} href={item.href} className={itemClass(isActive(item.href))}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {label(item)}
                    {badge && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                );
              });
            }

            const groupActive = items.some((i) => isActive(i.href));
            const activeChild = items.find((i) => isActive(i.href));
            return (
              <DropdownMenu key={gi}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={itemClass(groupActive)}>
                    {activeChild ? (
                      <activeChild.icon className="h-4 w-4 shrink-0" />
                    ) : null}
                    {getDashboardNavGroupLabel(group.title, t)}
                    {activeChild && (
                      <span className="font-mono text-[11px] font-normal opacity-80">
                        · {label(activeChild)}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-60">
                  {items.map((item) => {
                    const badge = badgeFor(item);
                    if (isLocked(item)) {
                      return (
                        <DropdownMenuItem key={item.href} disabled className="gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{label(item)}</span>
                          <Badge variant="outline" className="h-5 gap-0.5 px-1.5 text-[10px] font-normal">
                            <Crown className="h-2.5 w-2.5" />
                            {requiredPlanFor(item.requiredFeature!)}
                          </Badge>
                        </DropdownMenuItem>
                      );
                    }
                    return (
                      <DropdownMenuItem key={item.href} asChild className="gap-3">
                        <Link
                          href={item.href}
                          className={cn(isActive(item.href) && 'bg-accent text-accent-foreground')}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{label(item)}</span>
                          {badge && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                              {badge}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        <div className="ml-auto shrink-0">
          <UserMenu collapsed className="w-10 md:hidden" />
          <UserMenu className="hidden max-w-56 md:flex" />
        </div>
      </div>

      {/* Breadcrumb strip */}
      {crumbPage && (
        <div className="hidden h-11 items-center gap-2 border-t px-6 text-[13px] md:flex">
          {crumbGroup && (
            <>
              <span className="text-muted-foreground">{crumbGroup}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          )}
          <span className="font-medium">{crumbPage}</span>
        </div>
      )}
    </header>
  );
}
