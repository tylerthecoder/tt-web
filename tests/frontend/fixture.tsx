import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RandomBackground } from '../../app/components/Backgrounds/RandomBackground';
import { CommandMenu } from '../../app/components/CommandMenu';

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(
  <StrictMode>
    <RandomBackground />
    <main className="p-8 text-white">
      <h1 className="text-6xl">Home background preview</h1>
      <p>Press Control+K to open commands.</p>
    </main>
    <CommandMenu />
  </StrictMode>,
);
