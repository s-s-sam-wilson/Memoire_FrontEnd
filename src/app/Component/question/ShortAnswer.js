import { useState, useEffect } from 'react';
import { Pacifico, Raleway } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

export default function ShortAnswer({ questiontext, is_required, preview = false, onChange, value }) {
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (e) => {
    if (!preview) {
      const newText = e.target.value;
      setText(newText);
      onChange(newText);
    }
  };

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`text-gray-900 font-semibold text-base sm:text-lg flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <input
        type="text"
        placeholder="Short answer"
        value={text}
        onChange={handleChange}
        disabled={preview}
        className="text-gray-900 w-full p-3 border border-gray-300 rounded-xl text-sm sm:text-base shadow-md 
                  focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:outline-none 
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      />

    </div>
  );
}
