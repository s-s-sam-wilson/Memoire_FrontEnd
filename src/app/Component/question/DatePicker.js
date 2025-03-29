import { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function DatePicker({ questiontext, is_required, preview = false, onChange, value }) {
  const [internalValue, setInternalValue] = useState(value || "");

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    if (!preview) {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange(newValue);
    }
  };

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <div className="relative bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
      <input
        type="date"
        value={internalValue}
        onChange={handleChange}
        disabled={preview}
        className="w-full border border-gray-300 rounded-lg p-3 text-base sm:text-lg 
                  shadow-sm focus:ring-2 focus:ring-pink-500 focus:outline-none focus:border-pink-500
                  transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-white"
      />

      </div>
    </div>
  );
}
