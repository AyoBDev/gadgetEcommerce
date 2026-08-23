export type AdminRole = 'admin' | 'staff';

export function getSessionToken(cookies: Record<string, string> | undefined): string | null {
  const token = cookies?.['payload-token'];
  return token ? token : null;
}

export function canAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canManage(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'staff';
}