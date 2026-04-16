'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Header() {
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
        </div>
      </div>
    </header>
  );
}
