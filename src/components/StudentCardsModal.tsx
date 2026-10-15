import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { UserAccount, AppSettings, StudentLevel } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import {
  Printer,
  X,
  QrCode,
  Search,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  Sparkles,
  School,
  Lock,
  UserCheck
} from 'lucide-react';

interface StudentCardsModalProps {
  accounts: UserAccount[];
  isOpen: boolean;
  onClose: () => void;
  settings?: AppSettings;
  defaultClass?: string;
  defaultGrade?: StudentLevel;
}

export const StudentCardsModal: React.FC<StudentCardsModalProps> = ({
  accounts,
  isOpen,
  onClose,
  settings,
  defaultClass = 'All',
  defaultGrade
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultGrade || 'All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Determine application login URL
  const loginUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return 'https://ahs-prepline.app';
  }, []);

  // Generate QR code pointing to the login portal
  useEffect(() => {
    QRCode.toDataURL(loginUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => {
        console.error('Failed to generate QR code for login portal:', err);
      });
  }, [loginUrl]);

  // Extract all student accounts
  const studentAccounts = useMemo(() => {
    return accounts.filter(a => a.role === 'Student');
  }, [accounts]);

  // Available classes list
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    studentAccounts.forEach(a => {
      if (a.studentClass && a.studentClass.trim()) {
        set.add(a.studentClass.trim());
      }
    });
    return Array.from(set).sort();
  }, [studentAccounts]);

  // Filtered students according to class and grade
  const filteredStudents = useMemo(() => {
    return studentAccounts.filter(s => {
      if (selectedClass !== 'All' && (s.studentClass || 'Unassigned') !== selectedClass) {
        return false;
      }
      if (selectedGrade !== 'All' && s.studentLevel !== selectedGrade) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchUser = s.username.toLowerCase().includes(q);
        const matchClass = (s.studentClass || '').toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchClass) return false;
      }
      return true;
    });
  }, [studentAccounts, selectedClass, selectedGrade, searchTerm]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const logo = settings?.logoUrl || AHS_LOGO_SRC;
  const appName = settings?.appName || 'AHS Exams Prepline';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="relative w-full max-w-6xl bg-white border-2 border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-sky-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Student Login Cards Generator</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Print Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Official student credentials and direct QR code badges for classroom handouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={showPasswords ? 'Mask passwords with dots' : 'Show passwords on cards'}
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{showPasswords ? 'Mask Passwords' : 'Show Passwords'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print {filteredStudents.length} Cards</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Generator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Class Toolbar (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Grade */}
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-700">Grade:</span>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
              >
                <option value="All">All Grades ({studentAccounts.length})</option>
                <option value="Grade 6">Grade 6 (NAFS)</option>
                <option value="Grade 9">Grade 9 (NAFS)</option>
                <option value="High School">High School (SAT/GAT)</option>
              </select>
            </div>

            {/* Filter by Class */}
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-700">Class:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs"
              >
                <option value="All">All Classes ({availableClasses.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium w-40 sm:w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Ready to Print: <strong className="text-slate-900">{filteredStudents.length}</strong> Cards</span>
          </div>
        </div>

        {/* Print Layout & Cards Sheet */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white border-2 border-dashed border-slate-300 rounded-2xl space-y-2">
              <School className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No students match this class or filter</h3>
              <p className="text-xs text-slate-500">Select a different class or grade level to view and print student cards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-3 print:m-0">
              {filteredStudents.map((student, idx) => {
                const gradeLabel = student.studentLevel || 'Grade 6';
                const classLabel = student.studentClass || '6-A';
                const examTrack =
                  gradeLabel === 'High School'
                    ? 'Digital SAT & GAT Track'
                    : gradeLabel === 'Grade 9'
                    ? 'NAFS Grade 9 Assessment'
                    : 'NAFS Grade 6 Assessment';

                return (
                  <div
                    key={student.username || idx}
                    className="relative bg-white border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between overflow-hidden print:border-2 print:border-slate-800 print:rounded-xl print:p-4 print:break-inside-avoid print:shadow-none"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Top Tri-Color Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-700 via-[#1e3a8a] to-emerald-600" />

                    {/* Card Header: School Emblem & Name */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={logo}
                          alt="School Emblem"
                          className="h-9 w-auto max-w-[70px] object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] font-black tracking-tight text-slate-900 block truncate leading-tight uppercase">
                            {appName}
                          </span>
                          <span className="text-[9px] font-bold text-[#1e3a8a] tracking-wider uppercase block">
                            Student Examination Access Card
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#1e3a8a] border border-blue-300">
                          Class {classLabel}
                        </span>
                      </div>
                    </div>

                    {/* Student Identity Section */}
                    <div className="my-3 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Student Name
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight truncate">
                        {student.name}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {gradeLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600">
                          · {examTrack}
                        </span>
                      </div>
                    </div>

                    {/* Credentials & QR Code Section */}
                    <div className="grid grid-cols-3 gap-2.5 items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {/* Left 2 Cols: Credentials */}
                      <div className="col-span-2 space-y-2">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Portal Username
                          </span>
                          <span className="text-xs font-mono font-black text-[#1e3a8a] block select-all">
                            @{student.username}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Assigned Password
                          </span>
                          <span className="text-xs font-mono font-black text-slate-900 block tracking-wide select-all">
                            {showPasswords ? (student.password || 'password123') : '••••••••'}
                          </span>
                        </div>
                      </div>

                      {/* Right Col: QR Code */}
                      <div className="col-span-1 flex flex-col items-center justify-center text-center pl-1 border-l border-slate-200">
                        {qrCodeDataUrl ? (
                          <img
                            src={qrCodeDataUrl}
                            alt="Scan to Login"
                            className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded border border-slate-200 bg-white p-0.5 shadow-2xs"
                          />
                        ) : (
                          <div className="w-18 h-18 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400">
                            <QrCode className="w-8 h-8" />
                          </div>
                        )}
                        <span className="text-[8px] font-black text-[#1e3a8a] mt-1 leading-tight uppercase block">
                          Scan to Login
                        </span>
                      </div>
                    </div>

                    {/* Card Footer Security Guideline */}
                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[8px] font-semibold text-slate-500">
                      <span>Keep this credential card confidential.</span>
                      <span>Card #{idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Tip: In the print dialog, select <strong>"Save as PDF"</strong> or your office printer, and ensure <strong>"Background graphics"</strong> is checked for crisp badges.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cards</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
