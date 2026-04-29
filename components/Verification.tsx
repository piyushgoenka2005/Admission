"use client";
import React from 'react';
import { FileCheck, UserPlus } from 'lucide-react';

interface Props {
  setDocs: React.Dispatch<React.SetStateAction<File | undefined>>;
}

export default function Verification({ setDocs }: Props) {
  return (
    <section className="grid grid-cols-2 gap-10">
      <div className="p-10 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 bg-slate-50/50">
        <FileCheck size={40} className="text-slate-200" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Attach Official LOR (Signed by HOD)
        </p>
        <input type="file" className="text-[10px] font-bold" onChange={(e) => setDocs(e.target.files?.[0])} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[#0055A4] mb-2">
          <UserPlus size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Referral (Optional)</span>
        </div>
        <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none" placeholder="Referral Employee ID" />
        <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none" placeholder="Referral Name" />
      </div>
    </section>
  );
}
