import { TylersThings } from "tt-services";
import { baseLogger } from "../logger";


export const getTT = async () => {
    return TylersThings.make({ logger: baseLogger });
}