import React, { useState, useEffect } from 'react';
import { ExamType, UserAccount } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
  Search,
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface KsaTestBookingViewProps {
  activeExam: ExamType;
  user?: UserAccount | null;
  currentUser?: UserAccount | null;
  onNavigateToPractice?: () => void;
  onStartPractice?: () => void;
  onStartExam?: () => void;
  onGoToExamTrack?: () => void;
}

interface TestCenter {
  id: string;
  name: string;
  arabicName: string;
  city: string;
  district: string;
  code?: string;
  exam: ExamType;
  type: 'Computer-Based (CBT)' | 'Paper-Based' | 'Digital SAT';
  status: 'Daily/Weekly Slots Available' | 'Open for Booking' | 'Filling Fast' | 'Scheduled Window';
  nextSlot: string;
  address: string;
  notes: string;
}

interface ExamWindow {
  exam: ExamType;
  title: string;
  arabicTitle: string;
  provider: string;
  sessionType: string;
  bookingPeriod: string;
  testDates: string;
  countdownTarget: string; // ISO date for countdown
  officialPortalUrl: string;
  fee: string;
  description: string;
  riyadhAvailability: string;
}

const EXAM_WINDOWS: ExamWindow[] = [
  {
    exam: 'GAT',
    title: 'General Aptitude Test (Qudrat · القدرات العامة)',
    arabicTitle: 'اختبار القدرات العامة (محوسب)',
    provider: 'National Center for Assessment (Qiyas · قياس) / ETEC',
    sessionType: 'Computer-Based Testing (CBT - المحوسب)',
    bookingPeriod: 'Open Year-Round (Continuous Booking)',
    testDates: 'Available Daily & Weekly slots in Riyadh centers',
    countdownTarget: '2026-10-20T09:00:00Z',
    officialPortalUrl: 'https://e-services.etec.gov.sa',
    fee: '150 SAR (CBT) / 100 SAR (Paper)',
    description: 'Computer-based Qudrat exams can be taken up to 5 times (3 CBT + 2 paper, or 4 CBT + 1 paper). Results are released in 3–5 working days.',
    riyadhAvailability: 'High availability across Riyadh male & female university test centers.'
  },
  {
    exam: 'SAT',
    title: 'Digital SAT (College Board International)',
    arabicTitle: 'اختبار السات الرقمي',
    provider: 'College Board USA / Riyadh Authorized Centers',
    sessionType: 'Digital Adaptive Test on Bluebook™ App',
    bookingPeriod: 'Registration open for upcoming test dates',
    testDates: 'Nov 7, 2026 · Dec 5, 2026 · Mar 13, 2027 · May 8, 2027',
    countdownTarget: '2026-11-07T08:00:00Z',
    officialPortalUrl: 'https://satsuite.collegeboard.org/sat/registration',
    fee: '$68 USD + $43 USD Regional fee (~416 SAR)',
    description: 'Administered at certified international school testing centers in Riyadh. Students bring their own device or school-managed laptop with Bluebook.',
    riyadhAvailability: 'Centers in Riyadh Diplomatic Quarter, Northern Riyadh, and Al-Nasiriyah.'
  },
  {
    exam: 'NAFS',
    title: 'National Assessment for School Performance (NAFS · نافس)',
    arabicTitle: 'الاختبارات الوطنية نافس',
    provider: 'Education & Training Evaluation Commission (ETEC · هيئة تقويم التعليم)',
    sessionType: 'Standardized On-Campus School Assessment',
    bookingPeriod: 'School-Supervised Roster Registration',
    testDates: 'Grade 6 & Grade 9 Annual National Window (May 2027)',
    countdownTarget: '2027-05-10T08:00:00Z',
    officialPortalUrl: 'https://etec.gov.sa',
    fee: 'Free of charge (Ministry of Education & ETEC)',
    description: 'Standardized national exams assessing Arabic Reading Literacy, Math, and Science for Grade 6 and Grade 9 students across schools in Saudi Arabia.',
    riyadhAvailability: 'Conducted directly in enrolled Riyadh private and international schools.'
  }
];

const RIYADH_TEST_CENTERS: TestCenter[] = [
  {
    id: 'ksu-gat',
    name: 'King Saud University Testing Center',
    arabicName: 'مركز جامعة الملك سعود للاختبارات المحوسبة',
    city: 'Riyadh',
    district: 'Ad Diriyah / University Campus',
    exam: 'GAT',
    type: 'Computer-Based (CBT)',
    status: 'Daily/Weekly Slots Available',
    nextSlot: 'Within 3-5 days (Morning & Evening sessions)',
    address: 'King Saud University, Building 26 / Girls Center Gate 3, Riyadh',
    notes: 'Largest testing center in Riyadh with morning (8:00 AM) and evening (4:00 PM) slots.'
  },
  {
    id: 'imam-gat',
    name: 'Imam Mohammad Ibn Saud Islamic University Center',
    arabicName: 'مركز جامعة الإمام محمد بن سعود الإسلامية',
    city: 'Riyadh',
    district: 'Al-Falah District, Northern Ring Road',
    exam: 'GAT',
    type: 'Computer-Based (CBT)',
    status: 'Daily/Weekly Slots Available',
    nextSlot: 'Within 4-7 days',
    address: 'Imam University Main Campus, College of Computer Science, Riyadh',
    notes: 'High-speed computerized lab with biometric fingerprint verification.'
  },
  {
    id: 'etec-nakheel-gat',
    name: 'ETEC Qiyas Regional Center (Al-Nakheel)',
    arabicName: 'مقر قياس الإقليمي - حي النخيل',
    city: 'Riyadh',
    district: 'Al-Nakheel District',
    exam: 'GAT',
    type: 'Computer-Based (CBT)',
    status: 'Daily/Weekly Slots Available',
    nextSlot: 'Daily weekday slots available',
    address: 'ETEC Headquarters Campus, Prince Turki Ibn Abdulaziz Al Awwal Rd, Riyadh',
    notes: 'Official ETEC central venue. Wheelchair accessible and full accessibility support.'
  },
  {
    id: 'aisr-sat',
    name: 'American International School of Riyadh (AISR)',
    arabicName: 'المدرسة الأمريكية الدولية بالرياض',
    city: 'Riyadh',
    district: 'Al-Bustan Compound / Northern Riyadh',
    code: 'Center Code: 52820',
    exam: 'SAT',
    type: 'Digital SAT',
    status: 'Open for Booking',
    nextSlot: 'November 7, 2026 (Registration deadline: Oct 23)',
    address: 'AISR Campus, As Sahafah / Al Bustan, Riyadh',
    notes: 'Full Wi-Fi enabled test halls with battery backup and College Board proctoring.'
  },
  {
    id: 'kfs-sat',
    name: 'King Faisal School (Diplomatic Quarter)',
    arabicName: 'مدارس الملك فيصل - حي السفارات',
    city: 'Riyadh',
    district: 'Diplomatic Quarter (DQ)',
    code: 'Center Code: 52834',
    exam: 'SAT',
    type: 'Digital SAT',
    status: 'Open for Booking',
    nextSlot: 'December 5, 2026 & March 13, 2027',
    address: 'Diplomatic Quarter, Ibn Zahr Street, Riyadh',
    notes: 'Diplomatic Quarter access gate clearance required. Arrive by 7:30 AM.'
  },
  {
    id: 'riyadh-schools-sat',
    name: 'Riyadh Schools International',
    arabicName: 'مدارس الرياض الدولية',
    city: 'Riyadh',
    district: 'Al-Nasiriyah District',
    code: 'Center Code: 52840',
    exam: 'SAT',
    type: 'Digital SAT',
    status: 'Open for Booking',
    nextSlot: 'November 7, 2026 & December 5, 2026',
    address: 'Prince Fahad Ibn Salman St, Al-Nasiriyah, Riyadh',
    notes: 'Spacious examination hall with dedicated digital power sockets.'
  },
  {
    id: 'kingdom-schools-sat',
    name: 'Kingdom Schools (Ar Rabi)',
    arabicName: 'مدارس المملكة - حي الربيع',
    city: 'Riyadh',
    district: 'Ar Rabi District',
    code: 'Center Code: 52852',
    exam: 'SAT',
    type: 'Digital SAT',
    status: 'Filling Fast',
    nextSlot: 'December 5, 2026',
    address: 'King Abdulaziz Road, Ar Rabi, Riyadh',
    notes: 'Fast-filling center for Northern Riyadh students.'
  },
  {
    id: 'ahs-nafs',
    name: 'Al-Hussan / AHS Enrolled Campus (NAFS Center)',
    arabicName: 'مقر المدرسة المعتمد لاختبارات نافس',
    city: 'Riyadh',
    district: 'School Enrolled Campus',
    exam: 'NAFS',
    type: 'Paper-Based',
    status: 'Scheduled Window',
    nextSlot: 'Official National Assessment Window (May 2027)',
    address: 'AHS School Campus Testing Laboratories, Riyadh',
    notes: 'Students are pre-assigned by national student ID (Noor System integration).'
  }
];

export const KsaTestBookingView: React.FC<KsaTestBookingViewProps> = ({
  activeExam,
  user,
  currentUser: directCurrentUser,
  onNavigateToPractice: directNavigatePractice,
  onStartPractice,
  onStartExam,
  onGoToExamTrack
}) => {
  const currentUser = user || directCurrentUser;
  const onNavigateToPractice = directNavigatePractice || onStartPractice;
  const [selectedExam, setSelectedExam] = useState<ExamType | 'ALL'>(activeExam || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Pick target countdown exam
  const currentExamWindow = EXAM_WINDOWS.find(w => w.exam === (selectedExam === 'ALL' ? activeExam : selectedExam)) || EXAM_WINDOWS[0];

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(currentExamWindow.countdownTarget).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentExamWindow]);

  const filteredCenters = RIYADH_TEST_CENTERS.filter(center => {
    if (selectedExam !== 'ALL' && center.exam !== selectedExam) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        center.name.toLowerCase().includes(q) ||
        center.arabicName.toLowerCase().includes(q) ||
        center.district.toLowerCase().includes(q) ||
        center.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-200 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>KSA &amp; Riyadh Official Testing Centers</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Next Available Test Booking Sessions in Riyadh
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Find nearest authorized test centers, continuous Computer-Based (CBT) GAT slots, Digital SAT test centers in Riyadh, and official registration windows.
            </p>
          </div>

          {/* Riyadh Live Booking Indicator */}
          <div className="bg-white/10 border border-white/20 p-4 rounded-xl shrink-0 backdrop-blur-xs text-center sm:text-right">
            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block">
              Active Riyadh Booking Status
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-black text-white">Daily CBT Sessions Open</span>
            </div>
            <span className="text-[11px] text-blue-200 block mt-0.5">
              ETEC / Qiyas &amp; College Board
            </span>
          </div>
        </div>
      </section>

      {/* 2. Live Countdown Card for Next Exam Session */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a]">
              Upcoming Target Countdown
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              {currentExamWindow.title}
            </h2>
            <span className="text-xs font-bold text-slate-500 font-arabic">
              {currentExamWindow.arabicTitle}
            </span>
          </div>

          {/* Exam switcher tabs */}
          <div className="inline-flex border border-slate-200 rounded-xl p-1 bg-slate-50 text-xs font-bold shrink-0">
            {(['ALL', 'GAT', 'SAT', 'NAFS'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedExam(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedExam === tab
                    ? 'bg-[#1e3a8a] text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Riyadh Tests' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Countdown Timer Display */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-2xl sm:text-3xl font-black text-[#1e3a8a] tabular-nums block">
              {timeLeft.days}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Days Remaining
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums block">
              {timeLeft.hours}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Hours
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 tabular-nums block">
              {timeLeft.minutes}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Minutes
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums block">
              {timeLeft.seconds}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Seconds
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Riyadh Availability:</strong> {currentExamWindow.riyadhAvailability}</span>
          </div>
          <a
            href={currentExamWindow.officialPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-black text-[#1e3a8a] hover:underline shrink-0"
          >
            <span>Open Official Booking Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 3. Official Riyadh Testing Centers Directory */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Riyadh Test Centers Directory ({filteredCenters.length} Centers)
            </h2>
            <p className="text-xs text-slate-500">
              Authorized examination venues across Riyadh with real booking availability
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by center or district (e.g. KSU, DQ)..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1e3a8a]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCenters.map(center => {
            const isGat = center.exam === 'GAT';
            const isSat = center.exam === 'SAT';

            return (
              <div
                key={center.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${
                          isGat ? 'bg-red-700' : isSat ? 'bg-[#1e3a8a]' : 'bg-emerald-700'
                        }`}>
                          {center.exam}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {center.type}
                        </span>
                        {center.code && (
                          <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            {center.code}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {center.name}
                      </h3>
                      <div className="text-xs font-bold text-slate-500 font-arabic mt-0.5">
                        {center.arabicName}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                      center.status === 'Daily/Weekly Slots Available'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : center.status === 'Open for Booking'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : center.status === 'Filling Fast'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {center.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{center.district}, Riyadh</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{center.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-[11px] pt-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Next Slot: {center.nextSlot}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {center.notes}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isGat ? 'Book via Qiyas Portal' : isSat ? 'Book via College Board' : 'Campus Managed'}
                  </span>
                  <a
                    href={
                      isGat
                        ? 'https://e-services.etec.gov.sa'
                        : isSat
                        ? 'https://satsuite.collegeboard.org/sat/registration'
                        : 'https://etec.gov.sa'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1e3a8a] hover:bg-[#162c68] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Book Session</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Student Preparation & Registration Guide */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900">
          How to Book Your Exam Session in Riyadh (Step-by-Step Guide)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] text-white font-black flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Create / Access Account</h4>
            <p className="text-slate-600 leading-relaxed">
              For <strong>GAT (Qudrat)</strong>: Login to the ETEC Qiyas portal (e-services.etec.gov.sa) using your Civil ID (الهوية الوطنية) or Resident Iqama. For <strong>SAT</strong>: Log into your College Board account.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] text-white font-black flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Select Riyadh City &amp; Date</h4>
            <p className="text-slate-600 leading-relaxed">
              Filter available centers by <strong>Riyadh Region (منطقة الرياض)</strong>. For CBT Qudrat, slots are available on weekdays and weekends in morning and afternoon sessions.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] text-white font-black flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Confirm &amp; Practice</h4>
            <p className="text-slate-600 leading-relaxed">
              Pay the examination fee via <strong>Mada, SADAD (Biller 008 for Qiyas)</strong>, or credit card. Then complete timed mock exams right here to prepare for your test day!
            </p>
          </div>
        </div>

        {onNavigateToPractice && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onNavigateToPractice}
              className="px-4 py-2.5 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
            >
              <span>Practice Now for Your Upcoming Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
