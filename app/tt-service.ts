import { TylersThings } from "tt-services/src/lib";
import { MongoDBService } from "tt-services/src/connections/mongo";

class TylersThingsServiceClass {

    private tylersThings: TylersThings | null = null;

    async get() {
        if (!this.tylersThings) {
            const db = new MongoDBService();
            await db.connect();
            this.tylersThings = await TylersThings.make(db);
        }
        return this.tylersThings;
    }

}

export const TylersThingsService = new TylersThingsServiceClass();