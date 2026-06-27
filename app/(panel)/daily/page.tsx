'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { FaArrowLeft, FaArrowRight, FaCalendarAlt, FaSpinner, FaTimes } from 'react-icons/fa';
import { DailyNote, DailyNoteMetadata, isDailyNote } from 'tt-services/src/client-index';

import { MilkdownEditor } from '@/components/milkdown-note-editor';

import { getDailyNoteForDate, getNote as getNoteAction } from '../actions';
import { useAllDailyNotesMetadata, useDailyNote } from '../hooks';

export default function DailyPage() {
  const dailyNoteQuery = useDailyNote();
  const allDailyNotesMetadata = useAllDailyNotesMetadata();
  const [selectedNote, setSelectedNote] = useState<DailyNote | null>(null);
  const [isPending, startTransition] = useTransition();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const currentNote = selectedNote || dailyNoteQuery.data;
  const currentDay = currentNote?.day || currentNote?.date?.split('T')[0];
  const dailyNotesByDay = useMemo(() => {
    const notesByDay = new Map<string, DailyNoteMetadata>();

    for (const meta of allDailyNotesMetadata.data || []) {
      const day = (meta as { day?: string }).day || meta.date?.split('T')[0];
      if (day) {
        notesByDay.set(day, meta as DailyNoteMetadata);
      }
    }

    return notesByDay;
  }, [allDailyNotesMetadata.data]);
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);

    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    });
  }, [visibleMonth]);

  const fetchAndSetDay = useCallback(
    (day: string) => {
      startTransition(async () => {
        const existingNote = dailyNotesByDay.get(day);
        const note = existingNote
          ? await getNoteAction(existingNote.id)
          : await getDailyNoteForDate(day);

        if (!note) {
          console.error('Daily note not found for day:', day);
          return;
        }

        if (!isDailyNote(note)) {
          console.error('Note is not a daily note:', note.id);
          return;
        }

        setSelectedNote(note);
        setVisibleMonth(startOfMonth(parseISO(day)));
        setCalendarOpen(false);
        if (!existingNote) {
          await allDailyNotesMetadata.refetch();
        }
      });
    },
    [allDailyNotesMetadata, dailyNotesByDay],
  );

  const formatDate = (isoString: string) => {
    try {
      return format(parseISO(isoString.split('T')[0]), 'EEE, MMM d, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 bg-gray-900 text-white">
      <div className="flex min-h-0 flex-1 flex-col">
        {currentNote ? (
          <>
            <div className="relative z-20 flex flex-shrink-0 items-center justify-between border-b border-gray-700 p-3">
              <h2 className="min-w-0 px-3 text-base font-semibold sm:text-xl">
                {formatDate(currentNote.date)}
                {isPending && <FaSpinner className="animate-spin inline ml-2" />}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarOpen((open) => !open)}
                  className={`p-2 rounded transition-colors ${
                    calendarOpen ? 'bg-blue-800 text-white' : 'hover:bg-gray-700'
                  }`}
                  aria-label="Open calendar"
                  aria-expanded={calendarOpen}
                >
                  <FaCalendarAlt />
                </button>
              </div>
              {calendarOpen && (
                <div className="absolute right-3 top-full z-30 mt-2 w-[min(23rem,calc(100vw-1.5rem))] rounded border border-gray-700 bg-gray-900 p-3 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
                      className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
                      disabled={isPending}
                      aria-label="Previous month"
                    >
                      <FaArrowLeft />
                    </button>
                    <div className="text-sm font-semibold">{format(visibleMonth, 'MMMM yyyy')}</div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                        className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
                        disabled={isPending}
                        aria-label="Next month"
                      >
                        <FaArrowRight />
                      </button>
                      <button
                        onClick={() => setCalendarOpen(false)}
                        className="p-2 rounded text-gray-400 hover:bg-gray-700 hover:text-white"
                        aria-label="Close calendar"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  {allDailyNotesMetadata.isLoading ? (
                    <div className="flex h-56 items-center justify-center">
                      <span className="animate-spin inline-block w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-gray-500">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                          const dayKey = format(day, 'yyyy-MM-dd');
                          const note = dailyNotesByDay.get(dayKey);
                          const isSelected = currentDay === dayKey;
                          const isInMonth = isSameMonth(day, visibleMonth);

                          return (
                            <button
                              key={dayKey}
                              onClick={() => fetchAndSetDay(dayKey)}
                              disabled={isPending}
                              className={`relative aspect-square rounded border text-sm transition-colors ${
                                isSelected
                                  ? 'border-blue-300 bg-blue-800 text-white'
                                  : note
                                    ? 'border-gray-600 bg-gray-800 text-gray-100 hover:border-blue-500 hover:bg-gray-700'
                                    : 'border-gray-800 bg-gray-950 text-gray-500 hover:border-gray-600 hover:bg-gray-800 hover:text-gray-300'
                              } ${isInMonth ? '' : 'opacity-40'} ${isPending ? 'cursor-wait' : ''}`}
                              title={note ? `Open note for ${dayKey}` : `Create note for ${dayKey}`}
                            >
                              {format(day, 'd')}
                              <span
                                className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                                  note ? 'bg-emerald-400' : 'bg-gray-700'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Has note
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-gray-700" />
                          Empty
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {isPending && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-10">
                  <FaSpinner className="animate-spin text-4xl" />
                </div>
              )}
              <MilkdownEditor noteId={currentNote.id} hideTitle={true} key={currentNote.id} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isPending || dailyNoteQuery.isLoading ? (
              <FaSpinner className="animate-spin text-4xl" />
            ) : (
              'No daily note available'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
