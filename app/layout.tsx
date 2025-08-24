import './global.css';

import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

const analyticsId = 'G-B5KCWMNFJE';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="icon" href="/pi.png" sizes="any" />
      </head>
      <Analytics />
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
