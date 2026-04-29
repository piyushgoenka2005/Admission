"use client";
import React from 'react';
import { STATES } from '@/lib/states';
import { Student } from '@/types';

interface Props {
  formData: Omit<Student, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Student, 'id' | 'created_at'>>>;
}

export default function PersonalDetails({ formData, setFormData }: Props) {
  const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  React.useEffect(() => {
    if (!formData.start_date) {
      const today = getTodayIsoDate();
      setFormData((prev) => ({
        ...prev,
        start_date: today,
      }));
    }
  }, [formData.start_date, setFormData]);

  if (!formData) return null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#dcecff] bg-[#f7fbff] p-6 shadow-[0_20px_55px_rgba(143,199,255,0.10)] md:p-8">
      <div className="space-y-8">
        <div className="flex items-center gap-4 border-b border-[#dcecff] pb-4">
          <div className="h-12 w-2 rounded-full bg-gradient-to-b from-[#ff8db2] to-[#8fc7ff] shadow-[0_0_10px_rgba(143,199,255,0.3)]" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-600">Internship Portal</p>
            <h3 className="text-2xl font-black tracking-[0.12em] text-slate-800 uppercase">Student Details</h3>
          </div>
        </div>

        {/* 1. Personal Details */}
        <div className="border-b border-slate-200/60 pb-3">
          <h3 className="text-lg font-black text-slate-800 tracking-[0.18em] uppercase">1. Personal Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Salutation *</label>
            <select
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.salutation || 'Mr.'}
              onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
            >
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Dr.">Dr.</option>
            </select>
          </div>
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Student Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              placeholder="Enter student name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phone Number *</label>
            <input
              type="tel"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              placeholder="Enter phone number"
              value={formData.phone_number || ''}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email *</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              placeholder="student@example.com"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Gender *</label>
            <select
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.gender || ''}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">State *</label>
            <select
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="">Select State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Date of Birth *</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.date_of_birth || ''}
              onChange={(e) => {
                const dob = e.target.value;
                setFormData({ 
                  ...formData, 
                  date_of_birth: dob,
                  age: calculateAge(dob) || undefined
                });
              }}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Age</label>
            <input
              type="number"
              readOnly
              className="w-full rounded-xl border border-[#d8e6f7] bg-[#f3f7fc] px-4 py-3 font-medium text-slate-500 outline-none cursor-not-allowed"
              value={formData.age || ''}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">City</label>
            <input
              type="text"
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              placeholder="Enter city"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        {/* 3. Family Details */}
        <div className="border-b border-slate-200/60 pb-3">
          <h3 className="text-lg font-black text-slate-800 tracking-[0.18em] uppercase">2. Family Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Father's Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.fathers_name || ''}
              onChange={(e) => setFormData({ ...formData, fathers_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Mother's Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.mothers_name || ''}
              onChange={(e) => setFormData({ ...formData, mothers_name: e.target.value })}
            />
          </div>
        </div>

        {/* 4. Educational Details */}
        <div className="border-b border-slate-200/60 pb-3">
          <h3 className="text-lg font-black text-slate-800 tracking-[0.18em] uppercase">3. Educational Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">College Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.college_name || ''}
              onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">College Phone Number *</label>
            <input
              type="tel"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.college_phone_number || ''}
              onChange={(e) => setFormData({ ...formData, college_phone_number: e.target.value })}
            />
          </div>
          <div className="md:col-span-12 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">College Address *</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff] resize-none"
              value={formData.college_address || ''}
              onChange={(e) => setFormData({ ...formData, college_address: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">University Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.university_name || ''}
              onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Qualification *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.qualification || ''}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">HOD Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.hod_name || ''}
              onChange={(e) => setFormData({ ...formData, hod_name: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">HOD Email *</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.hod_email || ''}
              onChange={(e) => setFormData({ ...formData, hod_email: e.target.value })}
            />
          </div>
        </div>

        {/* 5. Address Details */}
        <div className="border-b border-slate-200/60 pb-3">
          <h3 className="text-lg font-black text-slate-800 tracking-[0.18em] uppercase">4. Address Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-12 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Permanent Address *</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff] resize-none"
              value={formData.permanent_address || ''}
              onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
            />
          </div>
          <div className="md:col-span-12 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Present Address *</label>
            <textarea
              required
              rows={3}
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff] resize-none"
              value={formData.present_address || ''}
              onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
            />
          </div>
        </div>

        {/* 7. Project / Internship Details */}
        <div className="border-b border-slate-200/60 pb-3">
          <h3 className="text-lg font-black text-slate-800 tracking-[0.18em] uppercase">5. Project / Internship Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Date of Joining *</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Date of Expiry *</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-[#d8e6f7] bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-[#8fc7ff] focus:ring-2 focus:ring-[#dcecff]"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
