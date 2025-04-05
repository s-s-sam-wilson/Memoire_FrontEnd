import { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Bottle({ 
  questiontext, 
  is_required, 
  preview = false, 
  onChange = () => {},  // Default empty function
  value 
}) {
  const [internalValue, setInternalValue] = useState(value ?? 0);

  useEffect(() => {
    setInternalValue(value ?? 0);
  }, [value]);

  const handleChange = (e) => {
    if (!preview) {
      const newValue = parseInt(e.target.value);
      setInternalValue(newValue);
      if (typeof onChange === 'function') {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`text-gray-900 font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <div className="relative bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
        <input
          type="range"
          min="0"
          max="10"
          value={internalValue}
          onChange={handleChange}
          disabled={preview}
          className="w-full h-3 sm:h-4 cursor-pointer appearance-none rounded-lg 
                     bg-gray-200 transition-all duration-200 focus:ring-2 focus:ring-pink-500 
                     disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
                background: `linear-gradient(to right, #ec4899 ${(internalValue / 10) * 100}%, #e5e7eb ${(internalValue / 10) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs sm:text-sm text-gray-800 mt-2 font-semibold">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
