'use client';

import { useTranslations } from 'next-intl';
import { LogOut, Settings } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@workspace/ansvisor-design-system/lib/utils';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSignOut } from '@/hooks/use-sign-out';
import { Avatar, AvatarFallback } from '@workspace/ansvisor-design-system/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ansvisor-design-system/components/ui/dropdown-menu';

interface UserProfileNavItemProps {
  collapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Name, email and avatar initials for whoever is signed in. */
function useUserIdentity() {
  const user = useAuthStore((state) => state.user);
  const fullName = user?.user_metadata?.full_name;
  const displayName = typeof fullName === 'string' ? fullName : '';
  const email = user?.email ?? '';

  const label = displayName || email || 'User Name';
  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')
    : (email[0]?.toUpperCase() ?? 'U');

  return { displayName, email, label, initials };
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <Avatar className="h-8 w-8 shrink-0">
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** Profile row that links to settings. Used inside the mobile menu. */
export function UserProfileNavItem({
  collapsed = false,
  onClick,
  className,
}: UserProfileNavItemProps) {
  const { label, initials } = useUserIdentity();

  return (
    <Link
      href="/dashboard/settings"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent',
        collapsed && 'justify-center px-0',
        className,
      )}
      title={collapsed ? label : undefined}
    >
      <UserAvatar initials={initials} />
      {!collapsed && <span className="truncate text-sm font-medium capitalize">{label}</span>}
    </Link>
  );
}

/**
 * Account menu for the top bar: the avatar opens a menu with the signed-in
 * email, a link to settings, and Sign out.
 */
export function UserMenu({
  collapsed = false,
  className,
}: Pick<UserProfileNavItemProps, 'collapsed' | 'className'>) {
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const { displayName, email, label, initials } = useUserIdentity();
  const { signOut, isSigningOut } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={tNav('accountMenu')}
          title={collapsed ? label : undefined}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent',
            collapsed && 'justify-center px-0',
            className,
          )}
        >
          <UserAvatar initials={initials} />
          {!collapsed && <span className="truncate text-sm font-medium capitalize">{label}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          {displayName && <p className="truncate text-sm font-medium capitalize">{displayName}</p>}
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-3">
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4 shrink-0" />
            {tNav('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-3"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {tAuth('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
