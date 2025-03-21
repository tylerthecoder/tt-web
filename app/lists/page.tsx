import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import Link from "next/link";
import { CreateListButton } from "./create-list-button";

async function getLists() {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.lists.getAllLists();
}

export default async function ListsPage() {
    const lists = await getLists();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Lists</h1>
                <CreateListButton />
            </div>

            <div className="grid gap-4">
                {lists.map((list) => (
                    <Link
                        key={list.id}
                        href={`/lists/${list.id}`}
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">{list.name}</h2>
                            <span className="text-gray-400">
                                {list.items.length} items
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}