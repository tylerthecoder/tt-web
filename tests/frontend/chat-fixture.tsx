import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChatColumn from '../../app/(panel)/ai/ChatColumn';
import { chats } from './mock-chat-actions';

function Fixture() {
  const [id, setId] = useState('one');
  return (
    <main className="h-dvh flex flex-col bg-gray-900 text-white">
      <button type="button" onClick={() => setId(id === 'one' ? 'two' : 'one')}>
        Switch chat
      </button>
      <div className="flex-1 min-h-0">
        <ChatColumn key={id} chat={chats[id]} />
      </div>
    </main>
  );
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
createRoot(root).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
