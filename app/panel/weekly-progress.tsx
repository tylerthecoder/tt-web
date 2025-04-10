'use client';

import React, { useState, useEffect } from 'react';
import { format, differenceInDays, differenceInHours } from 'date-fns';

interface WeeklyProgressProps {
    startDate: string; // ISO string date
    endDate: string;   // ISO string date
}

// Helper to add ordinal suffix (st, nd, rd, th)
function formatDayWithOrdinal(date: Date): string {
    return format(date, "MMM do"); // e.g., Feb 9th, Mar 1st
}

// Helper for full date with ordinal
function formatFullDayWithOrdinal(date: Date): string {
    return format(date, "EEEE MMMM do"); // e.g., Thursday April 10th
}

export function WeeklyProgress({ startDate, endDate }: WeeklyProgressProps) {
    const [progress, setProgress] = useState(0);
    const [formattedFullDate, setFormattedFullDate] = useState('');
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [formattedStartDate, setFormattedStartDate] = useState('');
    const [formattedEndDate, setFormattedEndDate] = useState('');

    useEffect(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        setFormattedStartDate(formatDayWithOrdinal(start));
        setFormattedEndDate(formatDayWithOrdinal(end));

        const calculateProgress = () => {
            const now = new Date();
            const localEnd = new Date(endDate);
            localEnd.setHours(23, 59, 59, 999);

            const totalDurationHours = differenceInHours(localEnd, start);
            const elapsedDurationHours = differenceInHours(now, start);

            let calculatedProgress = 0;
            if (totalDurationHours > 0) {
                calculatedProgress = Math.max(0, Math.min(100, (elapsedDurationHours / totalDurationHours) * 100));
            }

            setProgress(calculatedProgress);
            setFormattedFullDate(formatFullDayWithOrdinal(now));

            const remaining = differenceInDays(localEnd, now);
            setDaysRemaining(remaining >= 0 ? remaining + 1 : 0);
        };

        calculateProgress();
        const intervalId = setInterval(calculateProgress, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [startDate, endDate]);

    return (
        <div className="w-full max-w-md text-white">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-lg font-semibold">{formattedFullDate}</span>
                <span className="text-sm text-gray-400">
                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                </span>
            </div>
            {/* Progress bar container made relative */}
            <div className="relative w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                {/* Actual progress fill */}
                <div
                    className="absolute top-0 left-0 bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
                {/* Overlay text container */}
                <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
                    <span className="text-xs font-medium text-white mix-blend-difference">{formattedStartDate}</span>
                    <span className="text-xs font-medium text-white mix-blend-difference">{formattedEndDate}</span>
                </div>
            </div>
        </div>
    );
}