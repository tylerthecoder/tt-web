'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

