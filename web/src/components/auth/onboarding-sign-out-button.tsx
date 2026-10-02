'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { useSignOut } from '@/hooks/use-sign-out';

export function OnboardingSignOutButton() {
  const tAuth = useTranslations('auth');
  const { signOut, isSigningOut } = useSignOut();

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isSigningOut}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {tAuth('signOut')}
    </button>
  );
}
