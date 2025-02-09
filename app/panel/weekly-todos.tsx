"use client";

import { useEffect, useState } from "react";
import type { Week, WeekTodo } from "tt-services";
import { addTodo, getCurrentWeek, toggleTodo, updateTodoContent } from "./actions";

export function WeeklyTodos() {
    const [week, setWeek] = useState<Week | null>(null);
    const [newTodoContent, setNewTodoContent] = useState("");
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        getCurrentWeek().then(setWeek);
    }, []);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!week || !newTodoContent.trim()) return;

        const updatedWeek = await addTodo(week.id, newTodoContent);
        setWeek(updatedWeek);
        setNewTodoContent("");
    };

    const handleToggleTodo = async (todoId: string, checked: boolean) => {
        if (!week) return;
        const updatedWeek = await toggleTodo(week.id, todoId, checked);
        setWeek(updatedWeek);
    };

    const handleUpdateContent = async (todoId: string) => {
        if (!week || !editContent.trim()) return;
        const updatedWeek = await updateTodoContent(week.id, todoId, editContent);
        setWeek(updatedWeek);
        setEditingTodoId(null);
        setEditContent("");
    };

    const startEditing = (todo: WeekTodo) => {
        setEditingTodoId(todo.id);
        setEditContent(todo.content);
    };

    if (!week) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className={`text-3xl text-white mb-6 text-center`}>Weekly Todos</h2>

            <form onSubmit={handleAddTodo} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTodoContent}
                        onChange={(e) => setNewTodoContent(e.target.value)}
                        placeholder="Add a new todo..."
                        className="flex-grow px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </form>

            <div className="space-y-2">
                {week.todos.map((todo) => (
                    <div
                        key={todo.id}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                    >
                        <input
                            type="checkbox"
                            checked={todo.checked}
                            onChange={(e) => handleToggleTodo(todo.id, e.target.checked)}
                            className="w-5 h-5"
                        />

                        {editingTodoId === todo.id ? (
                            <div className="flex-grow flex gap-2">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="flex-grow px-2 py-1 rounded bg-gray-700 text-white"
                                />
                                <button
                                    onClick={() => handleUpdateContent(todo.id)}
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingTodoId(null)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div
                                className="flex-grow text-white cursor-pointer"
                                onClick={() => startEditing(todo)}
                            >
                                <span className={todo.checked ? "line-through text-gray-400" : ""}>
                                    {todo.content}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}