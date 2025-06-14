import { getCurrentWeek } from './actions';
import { AgeCounter } from '../components/age-counter';
import { WeeklyProgress } from './weekly-progress';
import { CountdownTimer } from '../components/countdown-timer';
import { PanelTabsClient } from './PanelTabsClient';
import { DatabaseSingleton } from 'tt-services/src/connections/mongo';
import { TylersThings } from 'tt-services/src/lib';
import { DailyNote } from 'tt-services/src/services/DailyNoteService';
import { NoteMetadata } from 'tt-services/src/services/NotesService';

export default async function PanelPage() {
    const week = await getCurrentWeek();
    const db = await DatabaseSingleton.getInstance();
    const tt = await TylersThings.make(db);
    const jots = await tt.jots.getAllJots();

    const initialDailyNote: DailyNote = await tt.dailyNotes.getToday();
    const allDailyNotesMetadata: NoteMetadata[] = await tt.dailyNotes.getAllNotesMetadata();
    const lists = await tt.lists.getAllLists();

    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 bg-gray-800 bg-opacity-50 flex-shrink-0 hidden md:block">
                <div className="flex justify-between items-center">
                    <WeeklyProgress
                        startDate={week.startDate}
                        endDate={weekEnd.toISOString()}
                    />
                    <div className="flex flex-col items-end">
                        <AgeCounter />
                        <CountdownTimer />
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden">
                <PanelTabsClient
                    week={week}
                    initialJots={jots}
                    initialDailyNote={initialDailyNote}
                    allDailyNotesMetadata={allDailyNotesMetadata}
                    initialLists={lists}
                />
            </div>
        </div>
    );
}