import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChatColumn from '../../app/(panel)/ai/ChatColumn';
import { chats } from './mock-chat-actions';

function Fixture() {
  const [id, setId] = useState('one');
  return (
    <main className="h-dvh bg-gray-900 text-white">
      <button type="button" onClick={() => setId(id === 'one' ? 'two' : 'one')}>
        Switch chat
      </button>
      <ChatColumn key={id} chat={chats[id]} />
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
