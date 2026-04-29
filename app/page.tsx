"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Server, UserCircle2 } from 'lucide-react';

export default function NRSCPortal() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/img2.avif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,54,0.26),rgba(11,32,72,0.14),rgba(7,21,54,0.28))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,227,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(160,210,255,0.22),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col justify-center">
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-5xl rounded-[2.3rem] border border-[rgba(219,238,255,0.58)] bg-[linear-gradient(180deg,rgba(233,245,255,0.88),rgba(221,239,255,0.76))] p-4 shadow-[0_30px_80px_rgba(10,31,72,0.22)] backdrop-blur-xl">
            <div className="rounded-[1.8rem] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.26)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <img
                src="/isro_banner.png"
                alt="Official NRSC/ISRO Banner"
                className="mx-auto w-full rounded-[1.4rem] object-contain max-h-32 md:max-h-44"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[3rem] border border-[rgba(213,234,255,0.56)] bg-[linear-gradient(180deg,rgba(225,240,255,0.72),rgba(215,234,255,0.60))] shadow-[0_30px_90px_rgba(10,31,72,0.22)] backdrop-blur-2xl">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative overflow-hidden px-8 py-12 md:px-12 md:py-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(143,199,255,0.22),transparent_34%)]" />
              <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-white/60" />
              <div className="relative z-10">
                <p className="text-center text-[11px] font-black uppercase tracking-[0.42em] text-slate-700 lg:text-left">
                  National Remote Sensing Centre
                </p>
                <h1 className="mt-5 text-center text-4xl font-black tracking-[0.18em] text-slate-950 md:text-6xl lg:text-left">
                  NRSC INTERNSHIP PORTAL
                </h1>
                
              </div>
            </section>

            <section className="border-t border-[rgba(213,234,255,0.62)] bg-[linear-gradient(180deg,rgba(231,244,255,0.82),rgba(223,239,255,0.72))] px-8 py-12 md:px-10 lg:border-l lg:border-t-0">
              <div className="rounded-[2.1rem] border border-white/60 bg-[rgba(255,255,255,0.22)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-800">Access Points</p>
                <div className="mt-6 space-y-5">
                  <button
                    onClick={() => router.push('/application')}
                    className="group w-full rounded-[2rem] border border-[rgba(202,226,252,0.8)] bg-[linear-gradient(180deg,rgba(243,249,255,0.94),rgba(230,241,255,0.90))] p-6 text-left shadow-[0_18px_42px_rgba(16,43,94,0.12)] transition hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-[#72b9ff] to-[#9fd3ff] text-white shadow-lg shadow-sky-300/40">
                          <UserCircle2 size={28} />
                        </div> 
                        <h2 className="text-2xl font-black text-slate-900">Student Application</h2>
                           </div>
                      <span className="pt-1 text-2xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">→</span>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin')}
                    className="group w-full rounded-[2rem] border border-[rgba(194,220,249,0.82)] bg-[linear-gradient(180deg,rgba(237,246,255,0.94),rgba(221,237,255,0.90))] p-6 text-left shadow-[0_18px_42px_rgba(16,43,94,0.12)] transition hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-[#4f98e8] to-[#86c0ff] text-white shadow-lg shadow-sky-300/40">
                          <Server size={28} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">Admin Login</h2>
                       </div>
                      <span className="pt-1 text-2xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">→</span>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
