import { requireAuth } from '@/utils/auth';

import Client from './time-tracker-client';

export default async function TimeTrackerPage() {
  await requireAuth();
  return <Client />;
}
