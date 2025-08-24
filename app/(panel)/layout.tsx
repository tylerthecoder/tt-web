import '../global.css';

import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

import { AgeCounter } from '@/components/age-counter';
import { CommandMenu } from '@/components/CommandMenu';
import { CountdownTimer } from '@/components/countdown-timer';
import { QueryProvider } from '@/components/query-provider';
import { TabsNav } from '@/components/tabs-nav';
import { WeeklyProgress } from '@/components/weekly-progress';

const analyticsId = 'G-B5KCWMNFJE';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <body suppressHydrationWarning className="flex flex-col bg-gray-900 w-full h-full">
      <Script
        strategy="lazyOnload"
        id="google-anal"
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
      />

      <Script id="google-anal2" strategy="lazyOnload">
        {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${analyticsId}', {
                    page_path: window.location.pathname,
                    });
                `}
      </Script>

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
        <div className="flex-grow">{children}</div>
      </QueryProvider>
      <Analytics />
    </body>
  );
}
