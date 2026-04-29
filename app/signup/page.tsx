"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, UserPlus, FileDigit } from 'lucide-react';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({ aadhaar: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (!/^\d{12}$/.test(formData.aadhaar)) {
            setError("Aadhaar must be exactly 12 digits");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar: formData.aadhaar, email: formData.email, password: formData.password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || 'Failed to create account');
            alert('Registration Successful! Please Sign In.');
            router.push('/signin');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020513] flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Colorful Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/30 blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/30 blur-[100px] pointer-events-none animate-pulse duration-[10000ms]" />
            <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-emerald-500/20 blur-[80px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/space_bg.jpg')] opacity-20 bg-cover mix-blend-screen mix-blend-overlay"></div>
                    <div className="relative z-10 flex justify-center mb-4">
                        <img src="/isro_logo_secondary.svg" alt="ISRO" className="h-16 object-contain bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 shadow-lg" />
                    </div>
                    <h2 className="relative z-10 text-2xl font-black tracking-wider uppercase drop-shadow-md">Student Registration</h2>
                    <p className="relative z-10 text-fuchsia-100 text-xs font-bold uppercase tracking-widest mt-2">NRSC Internship Portal</p>
                </div>

                <form onSubmit={handleSignup} className="p-8 space-y-6 bg-white">
                    {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">{error}</div>}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileDigit size={14} /> Aadhaar Number *
                        </label>
                        <input
                            type="text"
                            maxLength={12}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="12-digit Aadhaar Number"
                            value={formData.aadhaar}
                            onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <UserPlus size={14} /> Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="student@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield size={14} /> Password *
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm Password *</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-500/30 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Create Account'}
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-500 font-medium">Already have an account? <button type="button" onClick={() => router.push('/signin')} className="text-fuchsia-600 font-bold hover:underline">Sign In</button></p>
                    </div>
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/forgot-password')}
                            className="text-xs font-bold uppercase tracking-widest text-fuchsia-600 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
