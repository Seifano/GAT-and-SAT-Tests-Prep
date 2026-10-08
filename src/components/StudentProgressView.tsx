import React, { useState } from 'react';
import { UserAccount, TestAttempt, ExamType } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import {
  Users,
  Search,
  Target,
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen
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
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);

  // Filter only student accounts
  const studentAccounts = students.filter(a => a.role === 'Student');

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

  const filtered = studentStats.filter(item => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (item.student.name + ' ' + item.student.username + ' ' + (item.student.email || ''))
        .toLowerCase()
        .includes(term);

    const matchExam =
      examFilter === 'All'
        ? true
        : examFilter === 'NAFS'
        ? item.nafsAttemptsCount > 0 || item.attemptsCount === 0
        : examFilter === 'GAT'
        ? item.gatAttemptsCount > 0 || item.attemptsCount === 0
        : item.satAttemptsCount > 0 || item.attemptsCount === 0;

    return matchSearch && matchExam;
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
            {currentUser.role === 'Admin' ? 'Instructor & Admin Hub' : 'Teacher Portal'}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Student Progress &amp; Diagnostics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl break-words">
            Live diagnostic tracker showing authentic test attempts, scaled scores, and skill deficiencies across your roster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-bold text-[#201e1d] shrink-0">
            {studentAccounts.length} Total Students
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shrink-0">
            {activeStudentsCount} Active Test Takers
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-[#201e1d]/30 bg-white">
        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Enrolled Students</span>
          <span className="text-4xl font-black text-[#1f3d7a] my-2 tabular-nums">
            {studentAccounts.length}
          </span>
          <span className="text-xs text-slate-700 font-bold">In class roster</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Completed Tests</span>
          <span className="text-4xl font-black text-[#201e1d] my-2 tabular-nums">
            {totalAttemptsCount}
          </span>
          <span className="text-xs text-slate-700 font-bold">Mocks &amp; practice sets</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Active Participation</span>
          <span className="text-4xl font-black text-emerald-700 my-2 tabular-nums">
            {studentAccounts.length > 0
              ? Math.round((activeStudentsCount / studentAccounts.length) * 100)
              : 0}%
          </span>
          <span className="text-xs text-slate-700 font-bold">Completed &gt; 1 test session</span>
        </div>

        <div className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold">Diagnostic Status</span>
          <span className="text-4xl font-black text-[#201e1d] my-2 tabular-nums">
            {studentAccounts.length - activeStudentsCount}
          </span>
          <span className="text-xs text-amber-700 font-bold">Students unassessed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student by name or @username..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
          />
        </div>

        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 shadow-[inset_0_2px_3px_rgba(0,0,0,0.06)] gap-1">
          {(['All', 'NAFS', 'GAT', 'SAT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setExamFilter(tab)}
              className={`px-3.5 py-1 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                examFilter === tab
                  ? 'bg-white text-[#1f3d7a] shadow-[0_2px_0_0_#1f3d7a,0_2px_4px_rgba(0,0,0,0.1)] -translate-y-0.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white border-2 border-[#201e1d]/30 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-[#201e1d]/30 bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-3">Username</th>
              <th className="py-3 px-3 text-center">Tests Taken</th>
              <th className="py-3 px-3 text-center">Latest NAFS</th>
              <th className="py-3 px-3 text-center">Latest GAT</th>
              <th className="py-3 px-3 text-center">Latest SAT</th>
              <th className="py-3 px-3">Weakest Skill Area</th>
              <th className="py-3 px-3">Last Active</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No students found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map(item => {
                const { student, attemptsCount, latestNafsScore, latestGatScore, latestSatScore, weakestSkill, lastActive } = item;
                return (
                  <tr key={student.username} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#201e1d]">
                      {student.name}
                      {student.email && (
                        <span className="block text-[11px] text-slate-400 font-normal">{student.email}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">@{student.username}</td>
                    <td className="py-3.5 px-3 text-center font-black tabular-nums">
                      {attemptsCount > 0 ? (
                        <span className="text-[#1f3d7a]">{attemptsCount}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 (Pending)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">
                      {latestNafsScore !== null ? (
                        <span className="text-emerald-700 font-black">{latestNafsScore}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">
                      {latestGatScore !== null ? (
                        <span className="text-[#1f3d7a] font-black">{latestGatScore}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold tabular-nums">
                      {latestSatScore !== null ? (
                        <span className="text-[#1f3d7a] font-black">{latestSatScore}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
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
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-[#1f3d7a] cursor-pointer"
                      >
                        Inspect Progress
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Student Inspector Drawer / Modal */}
      {selectedStudent && activeDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#201e1d] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-slate-200 bg-[#f3f2f2]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Student Diagnostic Dossier
                </span>
                <h3 className="text-xl font-black text-[#201e1d]">{selectedStudent.name}</h3>
                <span className="text-xs text-slate-500 font-mono">@{selectedStudent.username}</span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 hover:bg-slate-200 text-[#201e1d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Tests Completed</span>
                  <span className="text-xl font-black text-[#1f3d7a] tabular-nums">
                    {activeDetail.attemptsCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Latest GAT</span>
                  <span className="text-xl font-black text-[#201e1d] tabular-nums">
                    {activeDetail.latestGatScore ?? 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Latest SAT</span>
                  <span className="text-xl font-black text-[#201e1d] tabular-nums">
                    {activeDetail.latestSatScore ?? 'None'}
                  </span>
                </div>
              </div>

              {/* Verified Attempt Records */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
                  Recorded Test Attempts ({activeDetail.studentAttempts.length})
                </h4>

                {activeDetail.studentAttempts.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 text-center text-slate-500">
                    No verified test attempts recorded yet for this student.
                  </div>
                ) : (
                  <div className="divide-y border border-slate-200">
                    {activeDetail.studentAttempts.map(att => (
                      <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
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
                className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
