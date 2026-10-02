'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@workspace/ansvisor-design-system/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useSignOut } from '@/hooks/use-sign-out';

/**
 * Right-hand side of the public header.
 *
 * Visitors get "Sign in" and "Create account". Someone who is already signed
 * in gets "Dashboard" and "Sign out" instead, so the public pages (home, audit
 * report) never leave them without a way out of their account.
 *
 * The session is read in the browser rather than on the server so the public
 * pages stay static and cacheable; the visitor buttons are what gets rendered
 * first and they are swapped once the session is known.
 */
export function MarketingAuthActions() {
  const t = useTranslations('auth');
  const [signedIn, setSignedIn] = useState(false);
  // Stay on the public page after signing out from it.
  const { signOut, isSigningOut } = useSignOut('/');

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  if (signedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={signOut} disabled={isSigningOut}>
          {t('signOut')}
        </Button>
        <Link href="/dashboard">
          <Button size="sm">{t('goToDashboard')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in">
        <Button variant="ghost" size="sm">
          {t('signIn')}
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm">{t('createAccount')}</Button>
      </Link>
    </div>
  );
}
