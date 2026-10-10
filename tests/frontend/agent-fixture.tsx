import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Client from '../../app/(panel)/agent/Client';
import { initialChat, secondChat } from './mock-agent-actions';

const root = document.getElementById('root');
if (!root) throw new Error('Missing fixture root');
createRoot(root).render(
  <StrictMode>
    <main className="h-dvh bg-gray-900 text-white">
      <Client initialChat={initialChat} initialChats={[initialChat, secondChat]} />
    </main>
  </StrictMode>,
);
