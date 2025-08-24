import '../global.css';

import NavBar from '../components/navbar';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-gray-900 w-full h-full">
      <NavBar />
      <div className="flex-grow">{children}</div>
    </div>
  );
}
