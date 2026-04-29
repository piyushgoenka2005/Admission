"use client";
import React from 'react';
import { Student } from '@/types';

interface Props {
  formData: Omit<Student, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Student, 'id' | 'created_at'>>>;
}

export default function Achievements({ formData, setFormData }: Props) {
  if (!formData) return null;

  return (
    <section className="bg-white/85 p-10 rounded-[2rem] shadow-[0_18px_45px_rgba(255,183,178,0.14)] border border-[#f3dde4] space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-1.5 h-6 bg-gradient-to-b from-[#ffb7b2] to-[#8fc7ff] rounded-full"></div>
        <h3 className="text-xl font-bold text-slate-800 tracking-wide uppercase">
          3. Projects, Achievements (Optional)
        </h3>
      </div>

      <div className="space-y-6">
        {/* Projects */}
        <div className="space-y-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Key Projects</span>
            <span className="text-[10px] text-slate-400 pl-1 font-medium">Detailed description of your relevant academic or personal projects.</span>
          </label>
          <textarea
            rows={4}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 resize-none mt-2"
            placeholder="1. Developed an AI powered navigation app..."
            value={formData.projects}
            onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
          />
        </div>

        {/* Publications */}
        <div className="space-y-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Publications / Research Papers (If Any)</span>
          </label>
          <textarea
            rows={3}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 resize-none"
            placeholder="Link to papers or titles..."
            value={formData.publications}
            onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
          />
        </div>

        {/* General Achievements */}
        <div className="space-y-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Awards & Extracurricular Achievements</span>
          </label>
          <textarea
            rows={3}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 resize-none"
            placeholder="Mention any awards, honors, hackathons won, etc."
            value={formData.achievements}
            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
          />
        </div>

      </div>
    </section>
  );
}
