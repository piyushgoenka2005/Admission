'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState('/admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLoginError(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setLoginError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/70 bg-white/80 p-10 shadow-[0_35px_80px_rgba(255,141,178,0.18)] backdrop-blur-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#ffe1ec] to-[#e7f6ff] text-[#ff6f91] shadow-lg">
          <Lock size={34} />
        </div>
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-slate-700">Secure Access</p>
        <h2 className="mt-3 text-center text-3xl font-black text-slate-800">Admin Console</h2>
        <p className="mt-2 text-center text-sm text-slate-500">Manage applications, intake, guides, and student records.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-[#f1dbe4] bg-[#fff7fb] px-4 py-4 font-medium text-slate-700 outline-none transition focus:border-[#ff8db2] focus:ring-2 focus:ring-[#ffdce6]"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-[#e2ebfa] bg-[#f7fbff] px-4 py-4 font-medium text-slate-700 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
            required
          />
          {loginError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              Invalid credentials
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff8db2] via-[#ffb7b2] to-[#8fc7ff] px-5 py-4 font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-pink-200/60 transition hover:-translate-y-1"
          >
            Authenticate
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-slate-600 ring-1 ring-slate-200 transition hover:-translate-y-0.5"
        >
          <ArrowLeft size={14} /> Return Home
        </button>
      </div>
    </div>
  );
}
