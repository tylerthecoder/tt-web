import '../global.css';

import { AgeCounter } from '@/components/age-counter';
import { CommandMenu } from '@/components/CommandMenu';
import { CountdownTimer } from '@/components/countdown-timer';
import { QueryProvider } from '@/components/query-provider';
import { TabsNav } from '@/components/tabs-nav';
import { WeeklyProgress } from '@/components/weekly-progress';
import { requireAuth } from '@/utils/auth';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-gray-900">
      <QueryProvider>
        <div className="p-4 bg-gray-800 bg-opacity-50 flex-shrink-0 hidden md:block">
          <div className="flex justify-between items-center">
            <WeeklyProgress />
            <div className="flex flex-col items-end">
              <AgeCounter />
              <CountdownTimer />
            </div>
          </div>
        </div>
        <TabsNav />
        <CommandMenu />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      </QueryProvider>
    </div>
  );
}
