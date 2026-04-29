"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileDigit, KeyRound, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    aadhaar: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!/^\d{12}$/.test(formData.aadhaar)) {
      setError('Aadhaar must be exactly 12 digits.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar: formData.aadhaar, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to reset password.');

      setSuccess('Password updated successfully. You can sign in now.');
      setTimeout(() => router.push('/signin'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020513] p-6">
      <div className="absolute left-[-10%] top-[-10%] h-[50vw] w-[50vw] rounded-full bg-cyan-600/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-fuchsia-600/25 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-[0_0_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 p-8 text-center text-white">
          <div className="absolute inset-0 bg-[url('/images/space_bg.jpg')] bg-cover opacity-20 mix-blend-screen mix-blend-overlay" />
          <div className="relative z-10 flex justify-center mb-4">
            <img src="/isro_logo_secondary.svg" alt="ISRO" className="h-16 rounded-2xl border border-white/30 bg-white/20 p-2 object-contain shadow-lg backdrop-blur-md" />
          </div>
          <h2 className="relative z-10 text-2xl font-black uppercase tracking-wider">Forgot Password</h2>
          <p className="relative z-10 mt-2 text-xs font-bold uppercase tracking-widest text-cyan-100">NRSC Internship Portal</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6 bg-white p-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs font-bold text-red-600">{error}</div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-700">{success}</div>
          ) : null}

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <FileDigit size={14} /> Aadhaar Number *
            </label>
            <input
              type="text"
              maxLength={12}
              required
              value={formData.aadhaar}
              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="Enter 12-digit Aadhaar"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <Mail size={14} /> Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="Enter your registered email"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <KeyRound size={14} /> New Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Confirm Password *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-1 hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Updating...' : 'Reset Password'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="text-center">
            <button type="button" onClick={() => router.push('/signin')} className="text-sm font-bold text-cyan-600 hover:underline">
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
