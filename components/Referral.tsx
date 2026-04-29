"use client";
import React from 'react';
import { Student } from '@/types';

interface Props {
    formData: Omit<Student, 'id' | 'created_at'>;
    setFormData: React.Dispatch<React.SetStateAction<Omit<Student, 'id' | 'created_at'>>>;
}

export default function Referral({ formData, setFormData }: Props) {
    if (!formData) return null;

    return (
        <section className="bg-white/85 p-10 rounded-[2rem] shadow-[0_18px_45px_rgba(199,182,255,0.16)] border border-[#e6defe] space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-1.5 h-6 bg-gradient-to-b from-[#c7b6ff] to-[#ff8db2] rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800 tracking-wide uppercase">
                    4. Reference (If Any)
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Referral Name</label>
                    <input
                        type="text"
                        className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                        placeholder="Name of ISRO/NRSC Employee"
                        value={formData.referral_name || ''}
                        onChange={(e) => setFormData({ ...formData, referral_name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Employee ID (E_ID)</label>
                    <input
                        type="text"
                        className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                        placeholder="Employee ID"
                        value={formData.referral_eid || ''}
                        onChange={(e) => setFormData({ ...formData, referral_eid: e.target.value })}
                    />
                </div>
            </div>
        </section>
    );
}
