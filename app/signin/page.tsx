"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, User } from 'lucide-react';

export default function Signin() {
    const router = useRouter();
    const [formData, setFormData] = useState({ aadhaar: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar: formData.aadhaar, email: formData.email, password: formData.password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || 'Authentication failed');

            localStorage.setItem('nrsc_auth_session', JSON.stringify({ id: data.id, aadhaar: data.aadhaar, email: data.email }));
            if (data.appId) localStorage.setItem('nrsc_app_id', data.appId);
            else localStorage.removeItem('nrsc_app_id');

            router.push('/application');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020513] flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Colorful Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/30 blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/30 blur-[100px] pointer-events-none animate-pulse duration-[10000ms]" />
            <div className="absolute top-[40%] right-[40%] w-[30vw] h-[30vw] rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/space_bg.jpg')] opacity-20 bg-cover mix-blend-screen mix-blend-overlay"></div>
                    <div className="relative z-10 flex justify-center mb-4">
                        <img src="/isro_logo_secondary.svg" alt="ISRO" className="h-16 object-contain bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 shadow-lg" />
                    </div>
                    <h2 className="relative z-10 text-2xl font-black tracking-wider uppercase drop-shadow-md">Student Sign In</h2>
                    <p className="relative z-10 text-cyan-100 text-xs font-bold uppercase tracking-widest mt-2">NRSC Internship Portal</p>
                </div>

                <form onSubmit={handleSignin} className="p-8 space-y-6 bg-white">
                    {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">{error}</div>}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <User size={14} /> Aadhaar Number *
                        </label>
                        <input
                            type="text"
                            maxLength={12}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Enter 12-digit Aadhaar"
                            value={formData.aadhaar}
                            onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <User size={14} /> Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Enter Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Shield size={14} /> Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <div className="mt-2 text-right">
                            <button
                                type="button"
                                onClick={() => router.push('/forgot-password')}
                                className="text-xs font-bold uppercase tracking-widest text-cyan-600 transition-colors hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-500 font-medium">New Student? <button type="button" onClick={() => router.push('/signup')} className="text-cyan-600 font-bold hover:underline">Register Here</button></p>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => router.push('/')} className="text-slate-400 text-xs font-bold hover:text-slate-600 uppercase tracking-widest transition-colors">Return to Home</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
