import { requireAuth } from '@/utils/auth';
import { PanelTabsClient } from '../panel-tabs-client';

export default async function PanelCatchAllPage() {
    await requireAuth();

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-grow overflow-hidden">
                <PanelTabsClient />
            </div>
        </div>
    );
}


