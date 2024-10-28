import { TylersThings } from "tt-services";

class TylersThingsServiceClass {

    private tylersThings: TylersThings | null = null;

     async get() {
        if (!this.tylersThings) {
            this.tylersThings = await TylersThings.make();
        }
        return this.tylersThings;
    }

}

export const TylersThingsService = new TylersThingsServiceClass();