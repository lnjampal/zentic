import type { Metadata } from 'next';
import { OffersPage } from '@/components/marketing/offers/offers-page';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Zentic | Get found by AI, then get booked',
  description:
    'A free AI readiness audit with fixes you can apply, and an AI chat assistant that answers customers and takes bookings on your website and WhatsApp.',
};

export default async function HomePage() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }
  return <OffersPage signedIn={signedIn} />;
}
