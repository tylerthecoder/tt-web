"use client";

import { useEffect, useState } from 'react';

// 11:50am CST
const BIRTH_DATE = new Date('1999-02-09T17:50:00Z'); // 11:50am Central Time (UTC-6)

function calculateAge(birthDate: Date) {
    const now = new Date();
    const diff = now.getTime() - birthDate.getTime();

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { years, months, days, hours, minutes, seconds };
}

export function AgeCounter() {
    const [age, setAge] = useState(calculateAge(BIRTH_DATE));

    useEffect(() => {
        const timer = setInterval(() => {
            setAge(calculateAge(BIRTH_DATE));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-white text-sm">
            <span className="font-bold">{age.years}</span> years,{' '}
            <span className="font-bold">{age.months}</span> months,{' '}
            <span className="font-bold">{age.days}</span> days,{' '}
            <span className="font-bold">{age.hours}</span> hours,{' '}
            <span className="font-bold">{age.minutes}</span> minutes,{' '}
            <span className="font-bold">{age.seconds}</span> seconds old
        </div>
    );
}