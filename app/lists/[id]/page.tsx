import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { ListItem } from "./list-item";
import { AddItemForm } from "./add-item-form";

async function getList(id: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.lists.getListById(id);
}

export default async function ListPage({ params }: { params: { id: string } }) {
    const list = await getList(params.id);
    if (!list) return <div>List not found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl font-bold mb-8">{list.name}</h1>

            <AddItemForm listId={list.id} />

            <div className="mt-8 space-y-4">
                {list.items.map((item) => (
                    <ListItem
                        key={item.id}
                        item={item}
                        listId={list.id}
                    />
                ))}
            </div>
        </div>
    );
}