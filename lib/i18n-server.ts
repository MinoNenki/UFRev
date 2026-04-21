import { cookies } from 'next/headers';
import { normalizeLanguage, type Language } from '@/lib/i18n';

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const value = cookieStore.get('lang')?.value;
  return normalizeLanguage(value);
}
