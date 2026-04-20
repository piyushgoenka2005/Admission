'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (mounted) {
          setAuthenticated(Boolean(data?.authenticated));
        }
      } catch {
        if (mounted) {
          setAuthenticated(false);
        }
      }
    };

    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setAuthenticated(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/isro.png"
              alt="ISRO logo"
              width={36}
              height={36}
              className="h-9 w-auto"
              priority
            />
            <span className="text-xl font-bold text-slate-900 hidden sm:inline">
              ISRO Internship Portal
            </span>
          </Link>

          {/* Title for small screens */}
          <div className="hidden md:flex items-center">
            <p className="text-sm text-slate-600">Internship Applications Management</p>
          </div>

          <div className="flex items-center gap-2">
            {authenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
