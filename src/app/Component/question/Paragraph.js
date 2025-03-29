import { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Paragraph({ questiontext, is_required, preview = false, onChange, value }) {
  const [text, setText] = useState(value || "");

  useEffect(() => {
    setText(value || "");
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
      <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <textarea
          placeholder="Write your answer here..."
          value={text}
          onChange={handleChange}
          disabled={preview}
          className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg text-gray-800 text-base shadow-md 
                    focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none 
                    transition-all duration-300 resize-y disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg"
          rows="4"
      />
    </div>
  );
}