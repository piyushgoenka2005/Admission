import re

with open("components/AdminDashboard.tsx", "r") as f:
    code = f.read()

# 1. Update Imports
code = code.replace(
    "import { ArrowLeft, Database, Search, Eye, Download, FileText, User as UserIcon, Calendar, GraduationCap, Award, Lock } from 'lucide-react';",
    "import { ArrowLeft, Database, Search, Eye, Download, FileText, User as UserIcon, Calendar, GraduationCap, Award, Lock, Shield, CheckCircle, XCircle } from 'lucide-react';"
)

# 2. Add Login State inside component
code = code.replace(
    "const [selectedStudent, setSelectedStudent] = useState<PopulatedStudent | null>(null);",
    """const [selectedStudent, setSelectedStudent] = useState<PopulatedStudent | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [assignScientistInput, setAssignScientistInput] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      setAssignScientistInput(selectedStudent.assigned_scientist || '');
    }
  }, [selectedStudent]);"""
)

# 3. Replace filteredStudents logic and add helper functions
old_filter_logic = """  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );"""

new_filter_logic = """  const handleUpdateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const { error } = await supabase.from('students').update(updates).eq('id', id);
      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      if (selectedStudent?.id === id) {
        setSelectedStudent(prev => prev ? { ...prev, ...updates } : null);
      }
      alert('Record updated successfully.');
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const calculateAverage = (academics?: AcademicDetail[]) => {
    if (!academics || academics.length === 0) return 0;
    const sum = academics.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0);
    return sum / academics.length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (score >= 75) return 'bg-blue-50 border-blue-200 text-blue-800';
    return 'bg-amber-50 border-amber-200 text-amber-800';
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const studentStatus = (s.status || 'PENDING').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || studentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'pass123') {
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isLoggedIn) {
     return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-50 z-[2000]">
          <div className="bg-white p-12 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <Shield size={40} className="text-[#004b87]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-center text-slate-800 mb-2">Secure Admin Login</h2>
            <p className="text-center text-slate-500 text-sm mb-8">Enter your credentials to access the database</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#004b87] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>
              
              {loginError && <p className="text-red-500 text-xs font-bold text-center">Invalid credentials. Please try again.</p>}
              
              <button
                type="submit"
                className="w-full py-4 bg-[#004b87] hover:bg-[#00396b] text-white rounded-xl font-black uppercase tracking-widest transition-colors shadow-lg"
              >
                Authenticate
              </button>
            </form>
            <button onClick={onLogout} className="w-full mt-4 py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">
              Return to Home
            </button>
          </div>
        </div>
     );
  }
"""

code = code.replace(old_filter_logic, new_filter_logic)

# 4. Add Status and Assignment controls in Record View
# Search for:
#                 <div className="grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-3">
#                   <div className="col-span-1 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Target Dates</div>
#                   <div className="col-span-2 text-emerald-700 font-bold">
#                     {selectedStudent.start_date} to {selectedStudent.end_date}
#                   </div>
#                 </div>
#               </div>
#             </div>

record_controls = """                <div className="grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-3">
                  <div className="col-span-1 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Target Dates</div>
                  <div className="col-span-2 text-emerald-700 font-bold">
                    {selectedStudent.start_date} to {selectedStudent.end_date}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-[#004b87] uppercase tracking-widest flex items-center gap-2">
                <Shield size={16} /> Admin Controls
              </h3>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-[#004b87] uppercase tracking-widest mb-2">Application Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStudent(selectedStudent.id!, { status: 'PENDING' })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${(!selectedStudent.status || selectedStudent.status === 'PENDING') ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStudent(selectedStudent.id!, { status: 'APPROVED' })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${selectedStudent.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => handleUpdateStudent(selectedStudent.id!, { status: 'REJECTED' })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${selectedStudent.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-[#004b87] uppercase tracking-widest mb-2">Assign Scientist / Guide</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Dr. K. Sivan"
                      value={assignScientistInput}
                      onChange={(e) => setAssignScientistInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-blue-200 outline-none focus:border-[#004b87]"
                    />
                    <button
                      onClick={() => handleUpdateStudent(selectedStudent.id!, { assigned_scientist: assignScientistInput })}
                      className="px-4 py-2 bg-[#004b87] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#00396b] transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>"""

code = code.replace("""                <div className="grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-3">
                  <div className="col-span-1 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Target Dates</div>
                  <div className="col-span-2 text-emerald-700 font-bold">
                    {selectedStudent.start_date} to {selectedStudent.end_date}
                  </div>
                </div>
              </div>
            </div>""", record_controls)

# 5. Add UI Status logic in List View
# Find this:
#           <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
#             <div className="flex flex-col">
#               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Applications</span>
#               <span className="text-3xl font-black text-[#004b87]">{students.length}</span>
#             </div>
#             <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
#               <Database size={24} />
#             </div>
#           </div>
#         </div>

# We will replace that entire actions/stats bar block
list_controls_old = """        {/* Actions / Stats Bar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
          <div className="flex-1 w-full max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-blue-50 font-medium transition-all shadow-sm"
            />
          </div>
          <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Applications</span>
              <span className="text-3xl font-black text-[#004b87]">{students.length}</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <Database size={24} />
            </div>
          </div>
        </div>"""

list_controls_new = """        {/* Actions / Stats Bar */}
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between w-full">
            <div className="flex-1 w-full max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-[#004b87] focus:ring-4 focus:ring-blue-50 font-medium transition-all shadow-sm"
              />
            </div>
            <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Results</span>
                <span className="text-3xl font-black text-[#004b87]">{filteredStudents.length}</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#004b87]">
                <Database size={24} />
              </div>
            </div>
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#004b87] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>"""

code = code.replace(list_controls_old, list_controls_new)

# 6. Update table headers to include Avg Marks, Status, Scientist
table_header_old = """                <thead>
                  <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Applicant Name</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Contact Details</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Duration</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Applied On</th>
                    <th className="p-5 text-center text-xs font-black text-slate-500 tracking-widest uppercase">Actions</th>
                  </tr>
                </thead>"""

table_header_new = """                <thead>
                  <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Applicant Name</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Avg Marks</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Status</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Guide</th>
                    <th className="p-5 text-xs font-black text-slate-500 tracking-widest uppercase">Applied On</th>
                    <th className="p-5 text-center text-xs font-black text-slate-500 tracking-widest uppercase">Actions</th>
                  </tr>
                </thead>"""

code = code.replace(table_header_old, table_header_new)

# 7. Update table body to show those fields + color
# We need to compute avg for each student inside map
table_body_old = """                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{student.first_name} {student.last_name}</div>
                            <div className="text-xs text-slate-400 font-medium">{student.salutation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-medium text-slate-700">{student.email}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{student.phone_number}</div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {student.duration.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-medium text-slate-600">
                          {new Date(student.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-5 text-center space-x-3">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-4 py-2 bg-white border border-slate-200 text-[#004b87] font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md hover:border-[#004b87] transition-all"
                        >
                          View Record
                        </button>
                      </td>
                    </tr>
                  ))}"""

table_body_new = """                  {filteredStudents.map((student) => {
                    const avgMarks = calculateAverage(student.academic_details);
                    const scoreColor = getScoreColor(avgMarks);
                    const status = student.status || 'PENDING';
                    
                    return (
                    <tr key={student.id} className={`transition-colors group border-b border-slate-100 ${status === 'REJECTED' ? 'opacity-50' : ''}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{student.first_name} {student.last_name}</div>
                            <div className="text-xs text-slate-400 font-medium">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        {avgMarks > 0 ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm ${scoreColor} border`}>
                            {avgMarks.toFixed(1)}% Avg
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Data</span>
                        )}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${
                          status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-bold text-slate-700">{student.assigned_scientist || <span className="text-xs text-slate-400 font-normal italic">Unassigned</span>}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-medium text-slate-600">
                          {new Date(student.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-5 text-center space-x-3">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-4 py-2 bg-white border border-slate-200 text-[#004b87] font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm hover:shadow-md hover:border-[#004b87] transition-all"
                        >
                          View Record
                        </button>
                      </td>
                    </tr>
                  )})}"""

code = code.replace(table_body_old, table_body_new)
code = code.replace("<th className=\"p-5 text-xs font-black text-slate-500 tracking-widest uppercase\">Contact Details</th>", "")

with open("components/AdminDashboard.tsx", "w") as f:
    f.write(code)

print("Patching complete.")
