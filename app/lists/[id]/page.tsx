import { ListItem } from "./list-item";
import { getTT } from "@/utils/utils";
import { AddItemForm } from "./add-item-form";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const tt = await getTT();
    const list = await tt.lists.getListById(resolvedParams.id);
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