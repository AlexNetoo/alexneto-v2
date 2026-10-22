import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/AdminApp';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminMessage } from '@/components/admin/AdminMessage';
import { AdminProviders } from '@/components/admin/AdminProviders';
import { adminConfigured, isAdmin } from '@/lib/admin-auth';
import { blobToken, getProjectsFresh } from '@/lib/projects-store';
import './admin.css';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  return <AdminProviders>{await screen()}</AdminProviders>;
}

async function screen() {
  if (!adminConfigured()) {
    return <AdminMessage text="The admin password is not configured on this server. Set the ADMIN_PASSWORD environment variable and redeploy." />;
  }
  if (!(await isAdmin())) return <AdminLogin />;

  let projects;
  let loadError: string | null = null;
  try {
    projects = await getProjectsFresh();
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Could not load projects.';
  }
  if (!projects) return <AdminMessage error text={loadError ?? 'Could not load projects.'} />;
  return <AdminApp initial={projects} storageReady={Boolean(blobToken())} />;
}
