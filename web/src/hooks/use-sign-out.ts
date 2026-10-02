'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useBrandStore } from '@/stores/use-brand-store';

/**
 * One sign-out path for every surface (account menu, mobile menu, settings,
 * onboarding, public header).
 *
 * Ends the Supabase session, forgets the brand list this browser remembered
 * for the account (it is kept in localStorage, so it would otherwise be shown
 * to whoever signs in next on the same computer), then does a full page load
 * so no in-memory state from the old session survives.
 */
export function useSignOut(redirectTo = '/sign-in') {
  const tAuth = useTranslations('auth');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      toast.error(tAuth('errors.signOutError'));
      return;
    }

    useBrandStore.setState({ brands: [], activeBrandId: null });
    window.location.href = redirectTo;
  }, [redirectTo, tAuth]);

  return { signOut, isSigningOut };
}
