"use client";

import { useParams, useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminStudentRecordPage() {
  const params = useParams<{ studentUid: string }>();
  const router = useRouter();

  return <AdminDashboard onLogout={() => router.push('/')} initialStudentUid={params.studentUid} />;
}
