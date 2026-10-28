import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserAccount, TestAttempt, ExamType, StudentLevel } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import {
  Search,
  Target,
  X,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

interface StudentProgressViewProps {
  students: UserAccount[];
  attempts: TestAttempt[];
  currentUser: UserAccount;
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  students,
  attempts,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState<'All' | 'NAFS' | 'GAT' | 'SAT'>('All');
  const [levelFilter, setLevelFilter] = useState<'All' | StudentLevel>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);

  const isTeacher = currentUser.role === 'Teacher';
  const assignedGrades = isTeacher
    ? (currentUser.assignedGrades && currentUser.assignedGrades.length > 0
        ? currentUser.assignedGrades
        : (currentUser.name?.toLowerCase().includes('houssem') ? ['Grade 9'] : ['Grade 6', 'High School']))
    : null;
  const assignedPathways = isTeacher
    ? (currentUser.assignedPathways && currentUser.assignedPathways.length > 0
        ? currentUser.assignedPathways
        : (assignedGrades?.includes('High School') ? ['GAT', 'SAT'] : ['NAFS']))
    : null;

  // Filter only student accounts, restricted to teacher's assigned grades if role is Teacher
  const studentAccounts = students.filter(a => {
    if (a.role !== 'Student') return false;
    if (isTeacher && assignedGrades && assignedGrades.length > 0) {
      return a.studentLevel && assignedGrades.includes(a.studentLevel);
    }
    return true;
  });

  // Compute student stats based on real attempts
  const studentStats = studentAccounts.map(student => {
    const studentAttempts = attempts.filter(
      a => (a.username || '').toLowerCase() === student.username.toLowerCase()
    );

    const nafsAttempts = studentAttempts.filter(a => a.exam === 'NAFS');
    const gatAttempts = studentAttempts.filter(a => a.exam === 'GAT');
    const satAttempts = studentAttempts.filter(a => a.exam === 'SAT');

    const latestNafs = nafsAttempts.length ? nafsAttempts[nafsAttempts.length - 1] : null;
    const latestGat = gatAttempts.length ? gatAttempts[gatAttempts.length - 1] : null;
    const latestSat = satAttempts.length ? satAttempts[satAttempts.length - 1] : null;

    // Weakest skill across all attempts
    const skillCounts: Record<string, { correct: number; total: number }> = {};
    studentAttempts.forEach(att => {
      (att.bySkill || []).forEach(bs => {
        if (!skillCounts[bs.skill]) skillCounts[bs.skill] = { correct: 0, total: 0 };
        skillCounts[bs.skill].correct += bs.correct;
        skillCounts[bs.skill].total += bs.total;
      });
    });

    let weakestSkill = 'None yet';
    let lowestPct = 101;
    Object.entries(skillCounts).forEach(([sk, stat]) => {
      if (stat.total >= 2) {
        const pct = Math.round((stat.correct / stat.total) * 100);
        if (pct < lowestPct) {
          lowestPct = pct;
          weakestSkill = `${sk} (${pct}%)`;
        }
      }
    });

    const lastActive = studentAttempts.length
      ? studentAttempts[studentAttempts.length - 1].date
      : student.created;

    return {
      student,
      studentLevel: student.studentLevel || 'Grade 6',
      studentClass: student.studentClass || 'Unassigned',
      attemptsCount: studentAttempts.length,
      nafsAttemptsCount: nafsAttempts.length,
      gatAttemptsCount: gatAttempts.length,
      satAttemptsCount: satAttempts.length,
      latestNafsScore: latestNafs?.score ?? null,
      latestGatScore: latestGat?.score ?? null,
      latestSatScore: latestSat?.score ?? null,
      weakestSkill,
      lastActive,
      studentAttempts
    };
  });

  // Extract distinct classes across student accounts
  const availableClasses = Array.from(
    new Set(
      studentAccounts
        .filter(s => s.studentClass)
        .map(s => s.studentClass as string)
    )
  ).sort();

  const filtered = studentStats.filter(item => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (item.student.name + ' ' + item.student.username + ' ' + (item.student.email || '') + ' ' + item.studentClass + ' ' + item.studentLevel)
        .toLowerCase()
        .includes(term);

    const matchExam =
      examFilter === 'All'
        ? true
        : examFilter === 'NAFS'
        ? item.nafsAttemptsCount > 0 || item.studentLevel !== 'High School'
        : examFilter === 'GAT'
        ? item.gatAttemptsCount > 0 || item.studentLevel === 'High School'
        : item.satAttemptsCount > 0 || item.studentLevel === 'High School';

    const matchLevel = levelFilter === 'All' || item.studentLevel === levelFilter;
    const matchClass = classFilter === 'All' || item.studentClass === classFilter;

    return matchSearch && matchExam && matchLevel && matchClass;
  });

  const activeStudentsCount = studentStats.filter(s => s.attemptsCount > 0).length;
  const totalAttemptsCount = attempts.length;

  // Selected student details
  const activeDetail = selectedStudent
    ? studentStats.find(s => s.student.username === selectedStudent.username)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            {currentUser.role === 'Admin' ? 'Academic Command Hub' : 'Faculty Portal'}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Student Progress &amp; Class Diagnostics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl break-words">
            {isTeacher && assignedGrades
              ? `Review diagnostics for your assigned students (${assignedGrades.join(', ')}). Other grades are restricted.`
              : 'Track student performance by assigned grade level (Grade 6, Grade 9, High School) and classroom section across authentic attempts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#201e1d] shrink-0">
            {studentAccounts.length} Students in Scope
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 shrink-0">
            {activeStudentsCount} Active Test Takers
          </div>
        </div>
      </div>

      {/* Teacher Scoped Grade & Pathway Assignment Banner */}
      {isTeacher && (assignedGrades || assignedPathways) && (
        <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-blue-950 text-sm block">
                Teacher Assigned Scope: {assignedPathways ? `[${assignedPathways.join(' & ')}]` : ''} {assignedGrades ? `· Grades: ${assignedGrades.join(' & ')}` : ''}
              </span>
              <span className="text-slate-600 text-[11px] block mt-0.5">
                Per institutional policy, your faculty account is authorized to evaluate student analytics within your assigned pathways and grade levels.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            {assignedPathways?.map(pw => (
              <span key={pw} className={`px-2.5 py-1 rounded-lg text-[10px] font-black text-white ${
                pw === 'NAFS' ? 'bg-emerald-700' : pw === 'GAT' ? 'bg-red-700' : 'bg-[#1e3a8a]'
              }`}>
                {pw} Track
              </span>
            ))}
            {assignedGrades?.map(g => (
              <span key={g} className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-[10px] font-black text-[#1e3a8a]">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between border-t-4 border-t-[#1e3a8a] hover:shadow-xs transition-shadow">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Total Enrolled</span>
          <span className="text-3xl sm:text-4xl font-black text-[#1e3a8a] my-2 tabular-nums">
            {studentAccounts.length}
          </span>
          <span className="text-xs text-slate-600 font-bold">Grade 6, 9 &amp; High School</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between border-t-4 border-t-emerald-600 hover:shadow-xs transition-shadow">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Grade 6 &amp; 9 (NAFS)</span>
          <span className="text-3xl sm:text-4xl font-black text-emerald-700 my-2 tabular-nums">
            {studentAccounts.filter(s => s.studentLevel === 'Grade 6' || s.studentLevel === 'Grade 9').length}
          </span>
          <span className="text-xs text-emerald-700 font-bold">Dedicated NAFS Literacy Track</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between border-t-4 border-t-blue-600 hover:shadow-xs transition-shadow">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">High School (SAT/GAT)</span>
          <span className="text-3xl sm:text-4xl font-black text-[#1e3a8a] my-2 tabular-nums">
            {studentAccounts.filter(s => s.studentLevel === 'High School').length}
          </span>
          <span className="text-xs text-blue-700 font-bold">University Admission Track</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between border-t-4 border-t-slate-700 hover:shadow-xs transition-shadow">
          <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">Completed Sessions</span>
          <span className="text-3xl sm:text-4xl font-black text-[#201e1d] my-2 tabular-nums">
            {totalAttemptsCount}
          </span>
          <span className="text-xs text-slate-600 font-bold">Mocks, sprints &amp; focus sets</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-slate-300 p-4 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search student, class (e.g. 6-A), or username..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
            />
          </div>

          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.06)] gap-1">
            {(() => {
              const availableTabs: ('All' | 'NAFS' | 'GAT' | 'SAT')[] =
                isTeacher && assignedPathways && assignedPathways.length > 0
                  ? ['All', ...(assignedPathways as ('NAFS' | 'GAT' | 'SAT')[])]
                  : ['All', 'NAFS', 'GAT', 'SAT'];

              return availableTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setExamFilter(tab)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                    examFilter === tab
                      ? 'bg-white text-[#1f3d7a] shadow-[0_2px_0_0_#1f3d7a,0_2px_4px_rgba(0,0,0,0.1)] -translate-y-0.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {tab}
                </button>
              ));
            })()}
          </div>
        </div>

        {/* Secondary Filters: Grade Level & Class Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
          <span className="text-[11px] font-bold text-slate-500">Filter Grade Level:</span>
          {([
            'All',
            ...(isTeacher && assignedGrades && assignedGrades.length > 0
              ? assignedGrades
              : ['Grade 6', 'Grade 9', 'High School'] as StudentLevel[])
          ] as ('All' | StudentLevel)[]).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-[#1f3d7a] text-white shadow-2xs font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}

          {availableClasses.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-bold text-slate-500">Filter Class:</span>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="select-modern text-xs font-bold"
              >
                <option value="All">All Classes ({availableClasses.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white border-2 border-[#201e1d]/30 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-2">Grade Level</th>
                <th className="py-3 px-2">Class</th>
                <th className="py-3 px-2 text-center">Tests</th>
                <th className="py-3 px-2 text-center">Latest NAFS</th>
                <th className="py-3 px-2 text-center">Latest GAT</th>
                <th className="py-3 px-2 text-center">Latest SAT</th>
                <th className="py-3 px-3">Weakest Area</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const { student, studentLevel, studentClass, attemptsCount, latestNafsScore, latestGatScore, latestSatScore, weakestSkill, lastActive } = item;
                  const isHS = studentLevel === 'High School';

                  return (
                    <tr key={student.username} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#201e1d]">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{student.username}</div>
                      </td>

                      <td className="py-3.5 px-2">
                        {studentLevel === 'Grade 6' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <BookOpen className="w-3 h-3" />
                            <span>Grade 6</span>
                          </span>
                        ) : studentLevel === 'Grade 9' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                            <BookOpen className="w-3 h-3" />
                            <span>Grade 9</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                            <Target className="w-3 h-3" />
                            <span>High School</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-2">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px] font-black text-slate-800">
                          {studentClass}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 text-center font-black tabular-nums">
                        {attemptsCount > 0 ? (
                          <span className="text-[#1f3d7a]">{attemptsCount}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>

                      {/* NAFS Score (N/A for High School students) */}
                      <td className="py-3.5 px-2 text-center font-mono font-bold tabular-nums">
                        {isHS ? (
                          <span className="text-[10px] text-slate-400 italic">N/A (HS)</span>
                        ) : latestNafsScore !== null ? (
                          <span className="text-emerald-700 font-black">{latestNafsScore}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* GAT Score (N/A for Grade 6 & 9 students) */}
                      <td className="py-3.5 px-2 text-center font-mono font-bold tabular-nums">
                        {!isHS ? (
                          <span className="text-[10px] text-slate-400 italic">N/A (NAFS)</span>
                        ) : latestGatScore !== null ? (
                          <span className="text-[#1f3d7a] font-black">{latestGatScore}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* SAT Score (N/A for Grade 6 & 9 students) */}
                      <td className="py-3.5 px-2 text-center font-mono font-bold tabular-nums">
                        {!isHS ? (
                          <span className="text-[10px] text-slate-400 italic">N/A (NAFS)</span>
                        ) : latestSatScore !== null ? (
                          <span className="text-[#1f3d7a] font-black">{latestSatScore}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-700 max-w-xs truncate">
                        {weakestSkill !== 'None yet' ? (
                          <span className="text-[#e15b47] font-bold">{weakestSkill}</span>
                        ) : (
                          <span className="text-slate-400">Needs assessment</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">{lastActive}</td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#1f3d7a] cursor-pointer shadow-2xs hover:border-[#1f3d7a]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Inspector Drawer / Modal */}
      {selectedStudent && activeDetail && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1f3d7a] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-slate-200 bg-[#f3f2f2]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Student Diagnostic Dossier
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl font-black text-[#201e1d]">{selectedStudent.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">@{selectedStudent.username}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-[#201e1d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Grade Level & Assigned Class Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl font-black text-xs text-white ${
                    activeDetail.studentLevel === 'Grade 6'
                      ? 'bg-emerald-600'
                      : activeDetail.studentLevel === 'Grade 9'
                      ? 'bg-teal-600'
                      : 'bg-[#1e3a8a]'
                  }`}>
                    {activeDetail.studentLevel}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      Class: {activeDetail.studentClass}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {activeDetail.studentLevel === 'High School'
                        ? 'Authorized for SAT & GAT pathways. NAFS restricted.'
                        : `Authorized for NAFS (${activeDetail.studentLevel}) pathway. SAT & GAT restricted.`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enrolled Student</span>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Tests Completed</span>
                  <span className="text-2xl font-black text-[#1f3d7a] tabular-nums">
                    {activeDetail.attemptsCount}
                  </span>
                </div>
                {activeDetail.studentLevel === 'High School' ? (
                  <>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Latest GAT</span>
                      <span className="text-2xl font-black text-[#201e1d] tabular-nums">
                        {activeDetail.latestGatScore ?? 'None'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Latest SAT</span>
                      <span className="text-2xl font-black text-[#201e1d] tabular-nums">
                        {activeDetail.latestSatScore ?? 'None'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Latest NAFS ({activeDetail.studentLevel})</span>
                    <span className="text-2xl font-black text-emerald-800 tabular-nums">
                      {activeDetail.latestNafsScore ?? 'Unassessed'}
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Attempt Records */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
                  Recorded Test Attempts ({activeDetail.studentAttempts.length})
                </h4>

                {activeDetail.studentAttempts.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
                    No verified test attempts recorded yet for this student.
                  </div>
                ) : (
                  <div className="divide-y border border-slate-200 rounded-xl overflow-hidden">
                    {activeDetail.studentAttempts.map(att => (
                      <div key={att.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-sm text-[#201e1d]">
                            {att.label} ({att.exam})
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {att.date} · {att.correct}/{att.total} correct · {Math.round(att.timeUsed / 60)} min
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-[#1f3d7a] tabular-nums block">
                            {att.score}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {Math.round((att.correct / att.total) * 100)}% accuracy
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-slate-200 bg-[#f3f2f2] flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-primary px-5 py-2 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
