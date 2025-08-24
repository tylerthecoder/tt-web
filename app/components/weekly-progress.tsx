'use client';

import { differenceInDays, differenceInHours, format } from 'date-fns';
import React, { useEffect, useState } from 'react';

import { useWeek } from '../(panel)/hooks';

function formatDayWithOrdinal(date: Date): string {
  return format(date, 'MMM do');
}

function formatFullDayWithOrdinal(date: Date): string {
  return format(date, 'EEEE MMMM do');
}

export function WeeklyProgress() {
  const weekQuery = useWeek();
  const [progress, setProgress] = useState(0);
  const [formattedFullDate, setFormattedFullDate] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [formattedStartDate, setFormattedStartDate] = useState('');
  const [formattedEndDate, setFormattedEndDate] = useState('');

  useEffect(() => {
    if (!weekQuery.data) return;
    const start = new Date(weekQuery.data.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    setFormattedStartDate(formatDayWithOrdinal(start));
    setFormattedEndDate(formatDayWithOrdinal(end));

    const calculateProgress = () => {
      const now = new Date();
      const localEnd = new Date(end);
      localEnd.setHours(23, 59, 59, 999);

      const totalDurationHours = differenceInHours(localEnd, start);
      const elapsedDurationHours = differenceInHours(now, start);

      let calculatedProgress = 0;
      if (totalDurationHours > 0) {
        calculatedProgress = Math.max(
          0,
          Math.min(100, (elapsedDurationHours / totalDurationHours) * 100),
        );
      }

      setProgress(calculatedProgress);
      setFormattedFullDate(formatFullDayWithOrdinal(now));

      const remaining = differenceInDays(localEnd, now);
      setDaysRemaining(remaining >= 0 ? remaining + 1 : 0);
    };

    calculateProgress();
    const intervalId = setInterval(calculateProgress, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [weekQuery.data]);

  return (
    <div className="w-full max-w-md text-white">
      {!weekQuery.data && <div className="text-sm text-gray-400 mb-2">Loading week…</div>}
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-lg font-semibold">{formattedFullDate}</span>
        <span className="text-sm text-gray-400">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
        </span>
      </div>
      <div className="relative w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="absolute top-0 left-0 bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
          <span className="text-xs font-medium text-white mix-blend-difference">
            {formattedStartDate}
          </span>
          <span className="text-xs font-medium text-white mix-blend-difference">
            {formattedEndDate}
          </span>
        </div>
      </div>
    </div>
  );
}
