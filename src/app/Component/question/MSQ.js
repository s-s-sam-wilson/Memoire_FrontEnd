import { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function MSQ({ questiontext, options, is_required, preview = false, onChange, value, max_selection }) {
  const [selected, setSelected] = useState(value || []);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

  const handleChange = (option) => {
    if (!preview) {
      let newSelected;
      if (selected.includes(option)) {
        newSelected = selected.filter((item) => item !== option);
      } else if (selected.length < (max_selection || options.length)) {
        newSelected = [...selected, option];
      } else {
        return; // Don't update if max_selection is reached
      }
      setSelected(newSelected);
      onChange(newSelected);
    }
  };

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <div className="mt-2 space-y-3">
        {options.map((option, index) => (
          <label key={index} className="flex items-center group bg-white p-3 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300 cursor-pointer">
            <input
              type="checkbox"
              value={option}
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
              disabled={preview}
              className="mr-3 h-5 w-5 appearance-none border-2 border-gray-400 rounded-md 
                        checked:bg-pink-500 checked:border-pink-500 focus:ring-2 focus:ring-pink-500 
                        transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed 
                        relative
                        after:content-[''] after:absolute after:top-1/2 after:left-1/2 
                        after:w-2 after:h-3 after:border-r-2 after:border-b-2 after:border-white 
                        after:rotate-45 after:-translate-x-1/2 after:-translate-y-2/3 after:scale-0 
                        checked:after:scale-100"
            />

            <span className="text-gray-800 text-base group-hover:text-pink-600 transition-colors duration-200">
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}