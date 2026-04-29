"use client";
import React from 'react';
import { AcademicDetail, Student } from '@/types';
import { Upload } from 'lucide-react';
import {
  POSTGRAD_DEGREE_OPTIONS,
  SPECIALIZATION_OPTIONS,
  UNDERGRAD_DEGREE_OPTIONS,
} from '@/lib/education';

interface Props {
  education: AcademicDetail[];
  setEducation: React.Dispatch<React.SetStateAction<AcademicDetail[]>>;
  formData: Omit<Student, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Student, 'id' | 'created_at'>>>;
}

export default function EducationTable({ education, setEducation, formData, setFormData }: Props) {

  const updateEdu = (index: number, field: keyof AcademicDetail, value: string | number | File | undefined) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const getDegreeOptions = (level?: string) => level === 'Undergrad' ? UNDERGRAD_DEGREE_OPTIONS : POSTGRAD_DEGREE_OPTIONS;

  return (
    <section className="bg-white/85 p-10 rounded-[2rem] shadow-[0_18px_50px_rgba(143,199,255,0.12)] border border-[#dcecff] space-y-10">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-1.5 h-6 bg-gradient-to-b from-[#8fc7ff] to-[#ff8db2] rounded-full"></div>
        <h3 className="text-xl font-bold text-slate-800 tracking-wide uppercase">
          2. Academic Details
        </h3>
      </div>

      <div className="space-y-8">
        {education.map((edu, index) => {
          const isSchool = edu.level === '10th' || edu.level === '10+2';
          const required = isSchool || edu.level === 'Undergrad'; // Make Postgrad optional

          return (
            <div key={edu.id} className="bg-gradient-to-br from-[#fffafc] to-[#f3fbff] p-6 rounded-2xl border border-[#e5edf8] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#ff8db2] to-[#8fc7ff]"></div>

              <div className="flex justify-between items-center mb-6 pl-4 border-b border-slate-200/60 pb-3">
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider">{edu.level}</h4>
                {!required && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">Optional</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pl-4">

                {isSchool ? (
                  <>
                    <div className="md:col-span-6 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Board *</label>
                      <input type="text" required={required}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                        placeholder="e.g. CBSE, ICSE, State Board"
                        value={edu.ui_board || ''} onChange={(e) => updateEdu(index, 'ui_board', e.target.value)} />
                    </div>
                    <div className="md:col-span-6 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">School Name *</label>
                      <input type="text" required={required}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                        placeholder="Institution Name"
                        value={edu.ui_institution || ''} onChange={(e) => updateEdu(index, 'ui_institution', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Degree Type {required ? '*' : ''}</label>
                      <select
                        required={required}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm"
                        value={edu.ui_degree_choice || edu.ui_degree_type || ''}
                        onChange={(e) => {
                          const choice = e.target.value;
                          updateEdu(index, 'ui_degree_choice', choice);
                          updateEdu(index, 'ui_degree_type', choice === 'Other' ? '' : choice);
                        }}
                      >
                        <option value="">Select degree</option>
                        {getDegreeOptions(edu.level).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {(edu.ui_degree_choice === 'Other') && (
                        <input
                          type="text"
                          required={required}
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                          placeholder="Enter custom degree"
                          value={edu.ui_degree_type || ''}
                          onChange={(e) => updateEdu(index, 'ui_degree_type', e.target.value)}
                        />
                      )}
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">University Name {required ? '*' : ''}</label>
                      <input type="text" required={required}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                        placeholder="University Name"
                        value={edu.ui_institution || ''} onChange={(e) => updateEdu(index, 'ui_institution', e.target.value)} />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Specialization {required ? '*' : ''}</label>
                      <select
                        required={required}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm"
                        value={edu.ui_specialization_choice || edu.ui_specialization || ''}
                        onChange={(e) => {
                          const choice = e.target.value;
                          updateEdu(index, 'ui_specialization_choice', choice);
                          updateEdu(index, 'ui_specialization', choice === 'Other' ? '' : choice);
                        }}
                      >
                        <option value="">Select specialization</option>
                        {SPECIALIZATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {(edu.ui_specialization_choice === 'Other') && (
                        <input
                          type="text"
                          required={required}
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                          placeholder="Enter custom specialization"
                          value={edu.ui_specialization || ''}
                          onChange={(e) => updateEdu(index, 'ui_specialization', e.target.value)}
                        />
                      )}
                    </div>
                  </>
                )}

                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Passing Year {required ? '*' : ''}</label>
                  <input type="number" required={required} min="1990" max="2100"
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                    placeholder="YYYY"
                    value={edu.passing_year || ''} onChange={(e) => updateEdu(index, 'passing_year', e.target.value)} />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">GPA / Score (%) {required ? '*' : ''}</label>
                  <input type="number" required={required} step="0.01"
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 text-sm placeholder:font-normal placeholder:text-slate-400"
                    placeholder="e.g. 8.5 or 85"
                    value={edu.ui_gpa || ''} onChange={(e) => updateEdu(index, 'ui_gpa', e.target.value)} />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Marksheet {required ? '*' : ''}</label>
                  <div className="relative">
                    <input type="file" id={`file-${edu.id}`} className="hidden"
                      required={required && !edu.file && !edu.marksheet_url}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          updateEdu(index, 'file', e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor={`file-${edu.id}`} className={`flex items-center justify-center gap-2 w-full p-4 border-2 ${edu.file || edu.marksheet_url ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-dashed border-slate-300 hover:border-[#004b87] hover:bg-blue-50 cursor-pointer text-slate-500 bg-white'} rounded-xl transition-all text-sm font-bold uppercase`}>
                      {edu.file ? (
                        <span className="truncate max-w-[180px]">{edu.file.name}</span>
                      ) : edu.marksheet_url ? (
                        <><Upload size={16} /> Marksheet Uploaded</>
                      ) : (
                        <><Upload size={16} /> Upload Doc</>
                      )}
                    </label>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-slate-100">
        <div className="space-y-4 max-w-2xl bg-gradient-to-r from-[#fff2f7] to-[#eef9ff] p-6 rounded-2xl border border-[#f4d8e5] relative">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            Letter of Recommendation (LOR) *
          </h4>
          <p className="text-[10px] text-slate-500 font-medium">Mandatory: Upload your official LOR signed by your Head of Department, Principal, or Placement Officer.</p>
          <div className="relative mt-2">
            <input
              type="file"
              id="lor-upload"
              required={!formData.lor_file && !formData.lor_url}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormData({ ...formData, lor_file: e.target.files[0] });
                }
              }}
            />
            <label
              htmlFor="lor-upload"
              className={`flex items-center justify-center gap-2 w-full p-5 border-2 ${formData.lor_file || formData.lor_url
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-dashed border-slate-300 hover:border-[#004b87] hover:bg-blue-50 cursor-pointer text-slate-500'
                } rounded-xl transition-all font-bold uppercase tracking-wider text-sm`}
            >
              {formData.lor_file ? (
                <span className="truncate max-w-[300px]">{formData.lor_file.name}</span>
              ) : formData.lor_url ? (
                <><Upload size={18} /> LOR Uploaded (Click to Change)</>
              ) : (
                <><Upload size={18} /> Choose File to Upload</>
              )}
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
