import './global.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="icon" href="/pi.png" sizes="any" />
      </head>
      {children}
    </html>
  );
}
