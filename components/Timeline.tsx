"use client";
import React from 'react';
import { Student } from '@/types';

interface Props {
  formData: Omit<Student, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Student, 'id' | 'created_at'>>>;
}

export default function Timeline({ formData, setFormData }: Props) {
  if (!formData) return null;

  const calculateEndDate = (start: string, duration: string) => {
    if (!start) return '';
    const startDate = new Date(start);

    switch (duration) {
      case '45_days':
        startDate.setDate(startDate.getDate() + 45);
        break;
      case '3_months':
        startDate.setMonth(startDate.getMonth() + 3);
        break;
      case '6_months':
        startDate.setMonth(startDate.getMonth() + 6);
        break;

      default:
        // fallback to 45 days if something goes wrong
        startDate.setDate(startDate.getDate() + 45);
    }

    return startDate.toISOString().split('T')[0];
  };

  return (
    <section className="bg-white/85 p-10 rounded-[2rem] shadow-[0_18px_45px_rgba(142,216,198,0.18)] border border-[#daf1eb] space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-1.5 h-6 bg-gradient-to-b from-[#8ed8c6] to-[#8fc7ff] rounded-full"></div>
        <h3 className="text-xl font-bold text-slate-800 tracking-wide uppercase">
          5. Proposed Duration & Timeline
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Preferred Duration */}
        <div className="md:col-span-12 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Preferred Internship Duration *</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {[
              { id: '45_days', label: '45 Days' },
              { id: '3_months', label: '3 Months' },
              { id: '6_months', label: '6 Months' },

              { id: 'custom', label: 'Custom' }
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.duration === option.id ? 'border-[#004b87] bg-blue-50 text-[#004b87]' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                <input
                  type="radio"
                  name="duration"
                  className="hidden"
                  value={option.id}
                  checked={formData.duration === option.id}
                  onChange={(e) => {
                    const newDuration = e.target.value;
                    let newEndDate = formData.end_date;
                    if (newDuration !== 'custom') {
                      newEndDate = calculateEndDate(formData.start_date, newDuration) || formData.end_date;
                    }
                    setFormData({ ...formData, duration: newDuration, end_date: newEndDate });
                  }}
                />
                <span className="font-bold text-sm tracking-wide">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div className="md:col-span-6 space-y-2 mt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Expected Start Date *</label>
          <input
            type="date"
            required
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
            value={formData.start_date}
            onChange={(e) => {
              const start = e.target.value;
              let end = formData.end_date;
              if (formData.duration !== 'custom') {
                end = calculateEndDate(start, formData.duration) || formData.end_date;
              }
              setFormData({ ...formData, start_date: start, end_date: end });
            }}
          />
        </div>

        {/* End Date */}
        <div className="md:col-span-6 space-y-2 mt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Expected End Date *</label>
          <input
            type="date"
            required
            readOnly={formData.duration !== 'custom'}
            className={`w-full p-4 rounded-xl border border-slate-200 outline-none transition-all font-medium text-slate-700 ${formData.duration !== 'custom' ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'bg-slate-50 focus:border-[#004b87] focus:ring-2 focus:ring-blue-100'}`}
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>

        <div className="md:col-span-12 mt-4 bg-gradient-to-r from-[#eefbf6] to-[#eef9ff] rounded-xl p-5 border border-[#d7eee7]">
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            <strong className="block mb-1 text-sm text-slate-800">Important Guidelines:</strong>
            Internship dates can be adjusted based on guide availability and university schedule. Minimum duration for B.Tech students is usually 45-60 days. M.Tech projects range from 6 to 12 months.
          </p>
        </div>
      </div>
    </section>
  );
}
