import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

export default function MCQ({ questiontext, options, is_required, preview = false, onChange, value, questionId, responseId }) {
  const handleChange = (option) => {
    if (!preview) {
      onChange(option);
    }
  };

  return (
    <div className="mb-6 px-2 sm:px-0">
      <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
        {questiontext} {is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
      </p>
      <div className="mt-2 space-y-3">
        {options.map((option, index) => (
          <label
            key={index}
            className="flex items-center group bg-white p-3 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-300 cursor-pointer"
          >
            <input
              type="radio"
              name={`mcq-${questionId}-${responseId}-${questiontext}`} // Unique name per question and response
              value={option}
              checked={preview ? value === option : undefined} // In preview mode, rely on value prop
              onChange={() => handleChange(option)}
              disabled={preview}
              className="mr-3 h-6 w-6 appearance-none border-2 border-gray-400 rounded-full 
                        focus:ring-2 focus:ring-pink-500 
                        checked:border-pink-500 relative transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                        before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-3 before:h-3 
                        before:bg-pink-500 before:rounded-full before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:scale-0 
                        checked:before:scale-100"
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