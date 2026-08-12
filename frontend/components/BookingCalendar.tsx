'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

interface BookingCalendarProps {
  checkIn: string; // Format: 'YYYY-MM-DD'
  checkOut: string; // Format: 'YYYY-MM-DD'
  onRangeChange: (newCheckIn: string, newCheckOut: string) => void;
  lang?: 'RO' | 'EN';
  minNights?: number;
}

export default function BookingCalendar({
  checkIn,
  checkOut,
  onRangeChange,
  lang = 'RO',
  minNights = 1,
}: BookingCalendarProps) {
  // Parsăm datele de start pentru afișarea lunii
  const initialDate = useMemo(() => {
    if (checkIn) {
      const d = new Date(checkIn);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [checkIn]);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState<'checkIn' | 'checkOut'>('checkIn');

  const todayStr = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []);

  const monthNamesRO = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const monthNamesEN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDaysRO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];
  const weekDaysEN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const monthLabel = useMemo(() => {
    const names = lang === 'RO' ? monthNamesRO : monthNamesEN;
    return `${names[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  }, [currentMonth, lang]);

  const nextMonthDate = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }, [currentMonth]);

  const nextMonthLabel = useMemo(() => {
    const names = lang === 'RO' ? monthNamesRO : monthNamesEN;
    return `${names[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;
  }, [nextMonthDate, lang]);

  // Generare zile pentru o lună specificată
  const generateMonthDays = (baseMonth: Date) => {
    const year = baseMonth.getFullYear();
    const month = baseMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Luni, 6 = Duminică
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
    }> = [];

    // Zile goale înainte de 1 ale lunii
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isPast: true,
      });
    }

    // Zilele lunii
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;

      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isPast,
      });
    }

    return days;
  };

  const currentMonthDays = useMemo(() => generateMonthDays(currentMonth), [currentMonth, todayStr]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Helper pentru a adăuga zile la un string YYYY-MM-DD
  const addDaysToStr = (dateStr: string, daysToAdd: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  // Click pe o dată din calendar
  const handleDateClick = (dateStr: string) => {
    if (!dateStr || dateStr < todayStr) return;

    if (selectionStep === 'checkIn') {
      // Utilizatorul alege Check-in
      // Regula: Check-out nu poate fi egal cu Check-in (minim 1 noapte diferență)
      let newCheckOut = checkOut;
      if (!newCheckOut || newCheckOut <= dateStr) {
        newCheckOut = addDaysToStr(dateStr, minNights);
      }
      onRangeChange(dateStr, newCheckOut);
      setSelectionStep('checkOut');
    } else {
      // Utilizatorul alege Check-out
      if (dateStr <= checkIn) {
        // Dacă utilizatorul a dat click pe aceeași zi sau o zi anterioară:
        // Noua zi devine Check-in, iar Check-out devine ziua următoare (+1 noapte minim)
        const nextDay = addDaysToStr(dateStr, minNights);
        onRangeChange(dateStr, nextDay);
        setSelectionStep('checkOut');
      } else {
        // Dată validă de check-out (> checkIn)
        onRangeChange(checkIn, dateStr);
        setSelectionStep('checkIn');
      }
    }
  };

  // Verificare status pentru stilizarea fiecărui pătrat din calendar
  const getDayStatus = (dateStr: string) => {
    if (!dateStr) return { isSelected: false, isStart: false, isEnd: false, isInRange: false, isHoverRange: false };

    const isStart = dateStr === checkIn;
    const isEnd = dateStr === checkOut;
    const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

    // Preview pe hover când se selectează Check-out
    let isHoverRange = false;
    if (selectionStep === 'checkOut' && hoverDate && hoverDate > checkIn && dateStr > checkIn && dateStr <= hoverDate) {
      isHoverRange = true;
    }

    return {
      isStart,
      isEnd,
      isInRange,
      isHoverRange,
      isSelected: isStart || isEnd,
    };
  };

  // Calcul număr nopți selectate
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [checkIn, checkOut]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Banner status interval */}
      <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {checkIn} → {checkOut}
          </span>
        </div>
        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30 rounded">
          {nightsCount} {lang === 'RO' ? (nightsCount === 1 ? 'noapte' : 'nopți') : (nightsCount === 1 ? 'night' : 'nights')}
        </span>
      </div>

      {/* Mesaj informativ regulă check-in ≠ check-out */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          {lang === 'RO'
            ? 'Check-out nu poate fi egal cu Check-in (sejur minim 1 noapte).'
            : 'Check-out cannot equal Check-in (minimum 1 night stay).'}
        </span>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 bg-white dark:bg-[#111317] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs space-y-4">
        {/* Header Navigație Lună */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-serif font-medium text-sm text-neutral-950 dark:text-white tracking-wide">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zilele Săptămânii */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
          {(lang === 'RO' ? weekDaysRO : weekDaysEN).map((day, idx) => (
            <div key={idx} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Pătrățelele Zilelor */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
          {currentMonthDays.map((dayItem, index) => {
            if (!dayItem.isCurrentMonth) {
              return <div key={`empty-${index}`} className="h-9 w-full" />;
            }

            const { isStart, isEnd, isInRange, isHoverRange, isSelected } = getDayStatus(dayItem.dateStr);

            // Stilizare pătrățel
            let containerClass = "relative h-9 w-full flex items-center justify-center text-xs font-mono transition-all ";
            let buttonClass = "w-8 h-8 flex items-center justify-center rounded-lg font-medium transition-all ";

            if (dayItem.isPast) {
              buttonClass += "text-neutral-300 dark:text-neutral-700 cursor-not-allowed opacity-40 ";
            } else if (isStart) {
              // Check-in (Punct de start)
              containerClass += "bg-amber-100/60 dark:bg-amber-950/40 rounded-l-lg ";
              buttonClass += "bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 font-bold shadow-md scale-105 ";
            } else if (isEnd) {
              // Check-out (Punct de final)
              containerClass += "bg-amber-100/60 dark:bg-amber-950/40 rounded-r-lg ";
              buttonClass += "bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 font-bold shadow-md scale-105 ";
            } else if (isInRange || isHoverRange) {
              // Interval evidențiat între check-in și check-out
              containerClass += "bg-amber-100 dark:bg-amber-500/20 ";
              buttonClass += "text-amber-950 dark:text-amber-200 font-semibold hover:bg-amber-200 dark:hover:bg-amber-500/30 ";
            } else {
              // Zile disponibile
              buttonClass += "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ";
            }

            return (
              <div key={dayItem.dateStr} className={containerClass}>
                <button
                  type="button"
                  disabled={dayItem.isPast}
                  onClick={() => handleDateClick(dayItem.dateStr)}
                  onMouseEnter={() => setHoverDate(dayItem.dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={buttonClass}
                >
                  {dayItem.dayNumber}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
