'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, buttonVariants } from '@workspace/ansvisor-design-system/components/ui/button';
import { Input } from '@workspace/ansvisor-design-system/components/ui/input';
import { Label } from '@workspace/ansvisor-design-system/components/ui/label';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
    });

    setIsLoading(false);
    // A send limit says nothing about whether the address exists, so it is safe to report.
    if (error && (error.status === 429 || error.code === 'over_email_send_rate_limit')) {
      toast.error(t('errors.tooManyEmails'));
      return;
    }

    // Otherwise always show the generic success state, whether or not the
    // email is registered: prevents account enumeration.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-accent p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
          <p className="text-sm text-accent-foreground">{t('resetLinkSent')}</p>
        </div>
        <Link
          href="/sign-in"
          className={buttonVariants({ variant: 'outline', className: 'w-full' })}
        >
          {t('backToSignIn')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sendingResetLink')}
          </>
        ) : (
          t('sendResetLink')
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline-offset-4 hover:text-primary hover:underline">
          {t('backToSignIn')}
        </Link>
      </p>
    </form>
  );
}
