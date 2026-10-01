import { createClient } from '@/lib/supabase/server';

/** Whether the current visitor is signed in (never throws). */
export async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}
