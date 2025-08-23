import NavBar from "../components/navbar";
import "../global.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { CommandMenuProvider } from "../components/CommandMenuProvider";
import { QueryProvider } from "../components/query-provider";

const analyticsId = "G-B5KCWMNFJE";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {

  return (
    <html>
      <head>
        <link rel="icon" href="/pi.png" sizes="any" />
      </head>

      <body className="flex flex-col bg-gray-900 w-full h-full">
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
          <CommandMenuProvider>
            <div className="flex-grow">{children}</div>
          </CommandMenuProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
