'use client';

import React, { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2028-01-01T00:00:00Z'); // Target end of 2027

interface TimeLeft {
  days: number;
}

function calculateTimeLeft(): TimeLeft | null {
  const now = new Date();
  const difference = TARGET_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return null;
  }

  // Calculate total days, rounding up to include the current day partially
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return { days };
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft());

  useEffect(() => {
    // Recalculate potentially less often as only days matter for display
    // but keep 1 sec for accuracy if needed later, or change to e.g., 1 minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // Keep 1 sec interval for now

    if (timeLeft === null) {
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!timeLeft) {
    return <div className="text-sm text-gray-400 mt-1">The time has come!</div>; // Added mt-1
  }

  return (
    // Added mt-1, removed text-gray-400 from container
    <div className="text-sm mt-1">
      <span className="font-semibold text-gray-200">{timeLeft.days}</span>
      <span className="text-gray-300"> days until 2028</span>
    </div>
  );
}
