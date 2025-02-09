"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bubblegum_Sans } from 'next/font/google';
import { login } from "./actions";

const bubblegum = Bubblegum_Sans({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

export default function LoginPage() {
    const [error, setError] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        try {
            const result = await login(formData);
            if (result.success) {
                router.push('/panel');
            } else {
                setError(result.error || 'Failed to login');
            }
        } catch (err) {
            setError('Failed to login');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md p-8 rounded-lg bg-gray-400 bg-opacity-70">
                <h1 className={`text-4xl text-white text-center mb-8 ${bubblegum.className}`}>Login</h1>

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-white text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2 px-4 border-2 border-white rounded-lg shadow-md
                     text-white bg-gray-400 bg-opacity-70 font-semibold
                     hover:bg-opacity-90 transform transition duration-150"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}