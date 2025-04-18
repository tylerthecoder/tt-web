'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createJotAction } from './actions';

export default function JotPage() {
    const [text, setText] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        const result = await createJotAction(formData);

        if (result?.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result?.success) {
            setMessage({ type: 'success', text: 'Jot saved successfully!' });
            setText(''); // Clear the input field
            formRef.current?.reset(); // Reset the form
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (message) {
            timer = setTimeout(() => {
                setMessage(null);
            }, 3000); // Clear message after 3 seconds
        }
        return () => clearTimeout(timer);
    }, [message]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8">Jot Something Down</h1>

            <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-md">
                <textarea
                    name="jotText"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your jot here..."
                    rows={4}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={!text.trim()} // Disable if text is empty or only whitespace
                >
                    Save Jot
                </button>
            </form>

            {message && (
                <div className={`mt-4 p-3 rounded-md w-full max-w-lg text-center ${message.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>
                    {message.text}
                </div>
            )}

            {/* Optional: Display existing jots here in the future */}
        </div>
    );
}