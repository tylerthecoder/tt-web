import { getCurrentWeek } from './actions';
import { AgeCounter } from '../components/age-counter';
import { WeeklyProgress } from './weekly-progress';
import { CountdownTimer } from '../components/countdown-timer';
import { PanelTabsClient } from './PanelTabsClient';
import { getTT } from '@/utils/utils';
import { requireAuth } from '../utils/auth';

export default async function PanelPage() {
    await requireAuth();
    const tt = await getTT();

    const [week, jots, initialDailyNote, allDailyNotesMetadata, lists] = await Promise.all([
        getCurrentWeek(),
        tt.jots.getAllJots(),
        tt.dailyNotes.getToday(),
        tt.dailyNotes.getAllNotesMetadata(),
        tt.lists.getAllLists(),
    ]);

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