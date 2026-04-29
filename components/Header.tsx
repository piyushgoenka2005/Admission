"use client";
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onBack: () => void;
}

export default function Header({ onBack }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pb-8 border-b border-slate-200/60 mt-4 relative z-10">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500 uppercase tracking-widest drop-shadow-sm">
          Student Application
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">
          Please fill out all the details accurately
        </p>
      </div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 font-bold uppercase text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all hover:-translate-x-1"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>
    </header>
  );
}