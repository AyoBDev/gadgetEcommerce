import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/admin-session';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return <AdminShell user={user}>{children}</AdminShell>;
}