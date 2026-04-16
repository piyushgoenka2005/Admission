'use client';

import { BrowserExtensionErrorGuard } from '@/components/BrowserExtensionErrorGuard';
import { InternsDashboard } from '@/components/InternsDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <BrowserExtensionErrorGuard />
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <InternsDashboard />
      </div>
    </main>
  );
}
