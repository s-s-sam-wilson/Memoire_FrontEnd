"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Pacifico, Raleway } from "next/font/google";

// Import fonts
const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

// Import question components
import MCQ from "../../Component/question/MCQ";
import MSQ from "../../Component/question/MSQ";
import ShortAnswer from "../../Component/question/ShortAnswer";
import Paragraph from "../../Component/question/Paragraph";
import ImageUpload from "../../Component/question/ImageUpload";
import DatePicker from "../../Component/question/DatePicker";
import Bottle from "../../Component/question/Bottle";
import Signature from "../../Component/question/Signature";

export default function SlambookPublicView() {
  const [slambookData, setSlambookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { urlid } = useParams();

  const questionComponents = {
    MCQ: MCQ,
    MSQ: MSQ,
    Text_One: ShortAnswer,
    Text_multi: Paragraph,
    IMAGE: ImageUpload,
    DATE: DatePicker,
    Bottle: Bottle,
    Sign: Signature,
  };

  useEffect(() => {
    const fetchSlambookData = async () => {
      try {
        const response = await axios.get(`https://memoire.pythonanywhere.com/slam/${urlid}`);
        setSlambookData(response.data);
      } catch (err) {
        setError("Error loading slambook");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (urlid) {
      fetchSlambookData();
    }
  }, [urlid]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate required questions
    const requiredQuestions = slambookData.questions.filter((q) => q.is_required);
    for (const q of requiredQuestions) {
      if (
        !answers[q.questionid] ||
        (Array.isArray(answers[q.questionid]) && answers[q.questionid].length === 0) ||
        (!Array.isArray(answers[q.questionid]) && answers[q.questionid] === "")
      ) {
        setSubmitError(`Please answer required question: "${q.questiontext}"`);
        return;
      }
    }

    try {
      // Format answers for submission
      const formattedAnswers = {};
      for (const [questionId, answer] of Object.entries(answers)) {
        const question = slambookData.questions.find((q) => q.questionid === questionId);

        if (question.type === "IMAGE" || question.type === "Sign") {
          if (answer instanceof File) {
            const formData = new FormData();
            formData.append("file", answer);
            const uploadResponse = await axios.post("https://memoire.pythonanywhere.com/upload/", formData);
            formattedAnswers[questionId] = uploadResponse.data.fileUrl;
          } else {
            formattedAnswers[questionId] = answer;
          }
        } else if (question.type === "MCQ" || question.type === "MSQ") {
          // Map option texts back to option IDs
          const optionIds = question.options
            .filter((opt) => answer.includes(opt.optiontext))
            .map((opt) => opt.optionid);
          formattedAnswers[questionId] = optionIds;
        } else {
          formattedAnswers[questionId] = answer;
        }
      }

      await axios.post(`https://memoire.pythonanywhere.com/slam/${urlid}/submit/`, { answers: formattedAnswers });

      setSubmitSuccess(true);
      setAnswers({});
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to submit your answers. Please try again.");
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-8 text-xl font-semibold">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#FFF3E6] to-[#FDE2E4] p-6 md:p-10 ${raleway.className}`}>
      {submitSuccess ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">
              Thanks for submitting!
            </h2>
            <p className="text-gray-600 mb-6">
              Want to create your own slambook?
            </p>
            <a href="/signup">
              <button
                className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-full transition-all duration-300 text-base font-semibold shadow-md hover:bg-pink-600"
              >
                Sign Up Now
              </button>
            </a>
          </div>
        </div>
      ) : (
        slambookData && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6 text-center">
              <h1 className={`text-3xl md:text-4xl font-bold text-gray-800 ${pacifico.className}`}>
                {slambookData.slambook.slamtitle}
              </h1>
              <p className="text-sm text-gray-600">
                Created: {new Date(slambookData.slambook.created).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {slambookData.questions.map((question) => {
                const QuestionComponent = questionComponents[question.type];
                return (
                  QuestionComponent && (
                    <div
                      key={question.questionid}
                      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 border border-gray-200"
                    >
                      <QuestionComponent
                        questiontext={question.questiontext}
                        questionId={question.questionid}
                        options={question.options?.map((opt) => opt.optiontext) || []}
                        is_required={question.is_required}
                        max_selection={question.max_selection}
                        onChange={(answer) => handleAnswerChange(question.questionid, answer)}
                        value={answers[question.questionid] || (question.type === "MSQ" ? [] : "")}
                      />
                    </div>
                  )
                );
              })}

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={submitSuccess}
                  className={`bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-full transition-all duration-300 text-base font-semibold shadow-md ${
                    submitSuccess ? "opacity-50 cursor-not-allowed" : "hover:bg-pink-600"
                  }`}
                >
                  Submit Your Answers
                </button>
              </div>

              {submitError && <div className="text-center text-red-500 text-sm mt-4">{submitError}</div>}
            </form>
          </div>
        )
      )}
    </div>
  );
}