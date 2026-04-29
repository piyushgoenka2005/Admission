"use client";

import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';

export default function DashboardPage() {
  const router = useRouter();

  return <AdminDashboard onLogout={() => router.push('/')} />;
}
