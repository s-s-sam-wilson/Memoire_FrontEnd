import { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function Signature({ questiontext, is_required, preview = false, onChange, value }) {
  const [file, setFile] = useState(value || null);
  const [previewURL, setPreviewURL] = useState(value ? URL.createObjectURL(value) : null);

  useEffect(() => {
    setFile(value || null);
    setPreviewURL(value ? URL.createObjectURL(value) : null);
  }, [value]);

  const handleChange = (e) => {
    if (!preview && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFile(newFile);
      setPreviewURL(URL.createObjectURL(newFile));
  
      if (onChange) {
        onChange(newFile);
      }
    }
  };
  

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <div className="relative bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={preview}
          className="w-full border border-gray-300 rounded-lg p-3 text-base sm:text-lg 
                     shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                     file:border-0 file:text-sm file:bg-pink-100 file:text-pink-700 
                     hover:file:bg-pink-200 transition-all duration-200 
                     disabled:opacity-60 disabled:cursor-not-allowed"
        />
        {previewURL && (
          <div className="mt-4">
            <p className="text-gray-700 text-sm mb-1">Preview:</p>
            <img src={previewURL} alt="Signature Preview" className="w-auto h-16 sm:h-24 border rounded-md shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
}
