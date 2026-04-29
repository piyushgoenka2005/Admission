"use client";

import React from 'react';
import { AcademicDetail } from '@/types';

interface Props {
  academics?: AcademicDetail[];
}

const COLORS = ['#f59e0b', '#f472b6', '#38bdf8', '#34d399', '#a78bfa', '#fb7185'];

export default function StudentMarksChart({ academics = [] }: Props) {
  const chartData = academics
    .filter((item) => Number(item.percentage || 0) > 0)
    .map((item, index) => ({
      label: item.education_type || `Level ${index + 1}`,
      value: Number(item.percentage || 0),
      color: COLORS[index % COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
        Marks visualization will appear here once academic percentages are available.
      </div>
    );
  }

  const average = chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length;
  const maxValue = Math.max(...chartData.map((item) => item.value), 100);

  return (
    <div className="rounded-[2rem] border border-[#f2d8df] bg-gradient-to-br from-[#fffdfd] via-[#fff7fb] to-[#eef9ff] p-6 shadow-[0_24px_50px_rgba(244,114,182,0.12)]">
      <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.6rem] bg-white/80 px-5 py-4 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Visual Rep</p>
          <h3 className="mt-1 text-2xl font-black text-slate-800">Student Marks Graph</h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Average</p>
          <p className="mt-1 text-3xl font-black text-slate-800">{average.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-5 rounded-[1.8rem] bg-white/82 p-6 shadow-sm">
        {chartData.map((item) => (
          <div key={item.label} className="grid grid-cols-[88px_1fr_58px] items-center gap-4">
            <span className="text-lg font-black text-slate-700">{item.label}</span>
            <div className="h-5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max((item.value / maxValue) * 100, 6)}%`,
                  background: `linear-gradient(90deg, ${item.color}, #8fc7ff)`,
                }}
              />
            </div>
            <span className="text-lg font-black text-slate-700">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
