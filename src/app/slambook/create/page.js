"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pacifico, Raleway } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

export default function SlambookCreate() {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(
                "https://memoire.pythonanywhere.com/slambook/",
                { slamtitle: title },
                { withCredentials: true }
            );

            if (response.status === 201) {
                router.push("/");
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Please log in to create a slambook.");
                router.push("/login");
            } else {
                setError(err.response?.data?.slamtitle?.[0] || "Failed to create slambook. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-[#FFF3E6] to-[#FDE2E4] flex flex-col text-gray-900 ${raleway.className}`}>
            <header className="bg-white shadow-md p-4 flex justify-between items-center md:px-8 lg:px-12 rounded-b-lg">
                <h1 className={`text-3xl font-bold text-gray-800 ${pacifico.className}`}>Memoire</h1>
                <button
                    onClick={() => router.push("/")}
                    className="text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
                >
                    Back
                </button>
            </header>

            <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col justify-center">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h2 className={`text-2xl font-semibold text-gray-800 mb-4 ${pacifico.className}`}>Create a New Slambook</h2>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 border border-red-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-800">Slambook Title</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a fun title!"
                                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-pink-500 text-white py-2 px-4 rounded-full font-medium hover:bg-pink-600 transition shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? "Creating..." : "Create Slambook"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}