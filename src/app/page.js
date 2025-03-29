"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Pacifico, Raleway } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

export default function Home() {
  const [user, setUser] = useState(null);
  const [slambooks, setSlambooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get("https://memoire.pythonanywhere.com/user/", {
          withCredentials: true,
        });
        setUser(userResponse.data);

        const slambooksResponse = await axios.get("https://memoire.pythonanywhere.com/slambook/", {
          withCredentials: true,
        });
        setSlambooks(slambooksResponse.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in to view this page.");
          router.push("/login");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post("https://memoire.pythonanywhere.com/logout/", {}, { withCredentials: true });
      setUser(null);
      router.push("/login");
    } catch (err) {
      setError("Logout failed. Please try again.");
      console.error("Logout error:", err);
    }
  };

  const handleCreateSlambook = () => {
    router.push("/slambook/create");
  };

  const handleDeleteSlambook = async (slamid) => {
    try {
      await axios.delete(`https://memoire.pythonanywhere.com/slambook/${slamid}/`, { withCredentials: true });
      setSlambooks(slambooks.filter((slambook) => slambook.slamid !== slamid));
    } catch (err) {
      setError("Failed to delete slambook. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD3A5] to-[#FD6585]">
        <p className={`text-2xl text-gray-900 font-semibold animate-pulse ${pacifico.className}`}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#FFF3E6] to-[#FDE2E4] flex flex-col text-gray-900 ${raleway.className}`}>
      <header className="bg-white shadow-md p-4 flex justify-between items-center md:px-8 lg:px-12 rounded-b-lg">
        <h1 className={`text-3xl font-bold text-gray-800 ${pacifico.className}`}>Memoire</h1>
        {user && (
          <button
            onClick={handleLogout}
            className="text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
          >
            Logout
          </button>
        )}
      </header>

      <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
        {user && (
          <div className="mb-8 text-center">
            <h2 className={`text-2xl text-gray-800 font-semibold ${pacifico.className}`}>Hey, {user.name}!</h2>
            <p className="text-gray-600 md:text-lg">{user.email}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm md:text-lg text-center border border-red-300">
            {error}
          </div>
        )}

        {user && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl text-gray-800 font-semibold ${pacifico.className}`}>Your Slambooks</h3>
              <button
                onClick={handleCreateSlambook}
                className="bg-pink-500 text-white px-6 py-2 rounded-full font-medium hover:bg-pink-600 transition duration-300 shadow-md"
              >
                + New
              </button>
            </div>

            {slambooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slambooks.map((slambook) => (
                  <div
                    key={slambook.slamid}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <p className={`text-gray-900 font-semibold text-lg ${pacifico.className}`}>{slambook.slamtitle}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/slambook/${slambook.slamid}`)}
                          className="bg-pink-500 text-white px-4 py-2 rounded-full font-medium hover:bg-pink-600 transition duration-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteSlambook(slambook.slamid)}
                          className="text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
                          >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(slambook.created).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={`text-gray-600 text-lg ${pacifico.className}`}>No slambooks yet</p>
                <button
                  onClick={handleCreateSlambook}
                  className="mt-3 text-pink-600 font-medium hover:text-pink-700 transition duration-200 underline"
                >
                  Create your first one!
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}