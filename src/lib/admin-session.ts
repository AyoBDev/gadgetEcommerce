import 'server-only';
import { cookies } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';

export type AdminUser = { id: number; role: string; email: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get('payload-token')?.value;
  if (!token) return null;
  try {
    const payload = await getPayloadClient();
    const headers = new Headers();
    headers.set('cookie', `payload-token=${token}`);
    const { user } = await payload.auth({ headers });
    if (!user) return null;
    return { id: user.id as number, role: user.role as string, email: user.email as string };
  } catch {
    return null;
  }
}