import { redirect } from 'next/navigation';

/** The offers page is now the home page. */
export default function OffersRedirect() {
  redirect('/');
}
