"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Pacifico, Raleway } from "next/font/google";

import MCQ from "../../../Component/question/MCQ";
import MSQ from "../../../Component/question/MSQ";
import ShortAnswer from "../../../Component/question/ShortAnswer";
import Paragraph from "../../../Component/question/Paragraph";
import DatePicker from "../../../Component/question/DatePicker";
import Bottle from "../../../Component/question/Bottle";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

export default function SlambookResponses() {
  const [slambook, setSlambook] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [imageData, setImageData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("byQuestion");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const router = useRouter();
  const { slamid } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slambookResponse = await axios.get(`https://memoire.pythonanywhere.com/slambook/${slamid}/`, {
          withCredentials: true,
        });
        setSlambook(slambookResponse.data);

        const questionsResponse = await axios.get(`https://memoire.pythonanywhere.com/slambook/${slamid}/question`, {
          withCredentials: true,
        });
        setQuestions(questionsResponse.data);

        const responsesResponse = await axios.get(`https://memoire.pythonanywhere.com/responses/${slamid}/`, {
          withCredentials: true,
        });
        const filteredResponses = responsesResponse.data.filter((res) => res.slamid === slamid);
        const responsesWithAnswers = await Promise.all(
          filteredResponses.map(async (res) => {
            const answers = await axios.get(`https://memoire.pythonanywhere.com/responses/${res.responseid}/answers/`, {
              withCredentials: true,
            });
            return { ...res, answers: answers.data };
          })
        );
        setResponses(responsesWithAnswers);

        const imagePromises = responsesWithAnswers.flatMap((res) =>
          res.answers
            .filter((ans) => ans.answer_image)
            .map((ans) =>
              axios
                .get(`https://memoire.pythonanywhere.com/image/?filename=${encodeURIComponent(ans.answer_image)}`, {
                  withCredentials: true,
                })
                .then((res) => ({ [ans.answer_image]: res.data.imageData }))
                .catch((err) => {
                  console.error(`Failed to fetch image ${ans.answer_image}:`, err);
                  return { [ans.answer_image]: null };
                })
            )
        );
        const images = await Promise.all(imagePromises);
        setImageData(Object.assign({}, ...images));
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in to view responses.");
          router.push("/login");
        } else {
          setError("Failed to load responses. Please try again.");
          console.error("Fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slamid, router]);

  const renderAnswerComponent = (question, answer) => {
    const options =
      question.type === "MCQ" || question.type === "MSQ"
        ? answer.answer_option.map((opt) => opt.optiontext)
        : [];

    switch (question.type) {
      case "Bottle":
        return <Bottle questiontext={question.questiontext} value={answer.bottle_value} preview={true} />;
      case "DATE":
        return <DatePicker questiontext={question.questiontext} value={answer.answer_text} preview={true} />;
      case "IMAGE":
      case "Sign":
        return answer.answer_image && imageData[answer.answer_image] ? (
          <>
            <p className={`font-semibold text-lg sm:text-xl flex items-center mb-2 ${pacifico.className}`}>
              {question.questiontext} {question.is_required && <span className="text-red-500 text-lg sm:text-xl">*</span>}
            </p>
            <img
              src={imageData[answer.answer_image]}
              alt={question.type === "IMAGE" ? "Uploaded Image" : "Signature"}
              className="w-auto h-24 rounded-md shadow-sm"
            />
          </>
        ) : (
          <p className="text-gray-700">{question.type === "IMAGE" ? "No image provided" : "No signature provided"}</p>
        );
      case "MCQ":
        return (
          <MCQ
            questiontext={question.questiontext}
            options={options}
            questionId={question.questionid}
            responseId={answer.responseid}
            value={answer.answer_option[0]?.optiontext || ""}
            preview={true}
          />
        );
      case "MSQ":
        return (
          <MSQ
            questiontext={question.questiontext}
            options={options}
            value={answer.answer_option.map((opt) => opt.optiontext)}
            preview={true}
          />
        );
      case "Text_multi":
        return <Paragraph questiontext={question.questiontext} value={answer.answer_text} preview={true} />;
      case "Text_One":
        return <ShortAnswer questiontext={question.questiontext} value={answer.answer_text} preview={true} />;
      default:
        return <p className="text-gray-700">No answer provided</p>;
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://memoire.pythonanywhere.com/slambook/${slamid}/export/`, {
        withCredentials: true,
        responseType: "blob", // Important for handling file downloads
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `slambook_${slambook.slamtitle}_responses.xlsx`); // Default filename
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up
    } catch (err) {
      setError("Failed to export responses. Please try again.");
      console.error("Export error:", err);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionSelect = (e) => {
    setCurrentQuestionIndex(parseInt(e.target.value));
  };

  const handleNextResponse = () => {
    if (currentResponseIndex < responses.length - 1) {
      setCurrentResponseIndex(currentResponseIndex + 1);
    }
  };

  const handlePreviousResponse = () => {
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(currentResponseIndex - 1);
    }
  };

  const handleResponseSelect = (e) => {
    setCurrentResponseIndex(parseInt(e.target.value));
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
      <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center md:px-8 lg:px-12 rounded-b-lg space-y-4 sm:space-y-0">
        <h1 className={`text-3xl font-bold text-gray-800 ${pacifico.className}`}>
          {slambook ? `${slambook.slamtitle} Responses` : "Responses"}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition duration-200 shadow-sm"
          >
            Export
          </button>
          <button
            onClick={() => router.push(`/slambook/${slamid}`)}
            className="text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
          >
            Back to Slambook
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm md:text-lg text-center border border-red-300">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("byQuestion")}
              className={`pb-2 px-4 font-semibold text-lg ${pacifico.className} ${
                activeTab === "byQuestion"
                  ? "text-pink-600 border-b-2 border-pink-500"
                  : "text-gray-600 hover:text-gray-800"
              } transition duration-200`}
            >
              By Question
            </button>
            <button
              onClick={() => setActiveTab("byResponse")}
              className={`pb-2 px-4 font-semibold text-lg ${pacifico.className} ${
                activeTab === "byResponse"
                  ? "text-pink-600 border-b-2 border-pink-500"
                  : "text-gray-600 hover:text-gray-800"
              } transition duration-200`}
            >
              By Response
            </button>
          </div>
        </div>

        {/* By Question Tab */}
        {activeTab === "byQuestion" && (
          <div>
            {questions.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 rounded-full font-medium transition duration-200 shadow-sm ${
                      currentQuestionIndex === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-pink-500 text-white hover:bg-pink-600"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`px-4 py-2 rounded-full font-medium transition duration-200 shadow-sm ${
                      currentQuestionIndex === questions.length - 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-pink-500 text-white hover:bg-pink-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="flex justify-center mb-6">
                  <select
                    value={currentQuestionIndex}
                    onChange={handleQuestionSelect}
                    className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-500 focus:outline-none transition duration-200"
                  >
                    {questions.map((question, index) => (
                      <option key={question.questionid} value={index}>
                        {question.questiontext}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
                  <h3 className={`text-xl text-gray-800 font-semibold mb-4 ${pacifico.className}`}>
                    {questions[currentQuestionIndex].questiontext}
                  </h3>
                  <div className="space-y-4">
                    {responses.map((response) => {
                      const answer = response.answers.find(
                        (ans) => ans.questionid === questions[currentQuestionIndex].questionid
                      );
                      return (
                        answer && (
                          <div key={response.responseid} className="text-gray-700">
                            <p className="text-sm text-gray-500">
                              {new Date(response.created).toLocaleString()}
                            </p>
                            {renderAnswerComponent(questions[currentQuestionIndex], answer)}
                          </div>
                        )
                      );
                    })}
                    {responses.every(
                      (res) => !res.answers.some((ans) => ans.questionid === questions[currentQuestionIndex].questionid)
                    ) && <p className="text-gray-600 italic">No answers yet</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className={`text-gray-600 text-lg text-center ${pacifico.className}`}>No questions found</p>
            )}
          </div>
        )}

        {/* By Response Tab */}
        {activeTab === "byResponse" && (
          <div>
            {responses.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePreviousResponse}
                    disabled={currentResponseIndex === 0}
                    className={`px-4 py-2 rounded-full font-medium transition duration-200 shadow-sm ${
                      currentResponseIndex === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-pink-500 text-white hover:bg-pink-600"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextResponse}
                    disabled={currentResponseIndex === responses.length - 1}
                    className={`px-4 py-2 rounded-full font-medium transition duration-200 shadow-sm ${
                      currentResponseIndex === responses.length - 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-pink-500 text-white hover:bg-pink-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="flex justify-center mb-6">
                  <select
                    value={currentResponseIndex}
                    onChange={handleResponseSelect}
                    className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-pink-500 focus:outline-none transition duration-200"
                  >
                    {responses.map((response, index) => (
                      <option key={response.responseid} value={index}>
                        Response from {new Date(response.created).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition duration-300">
                  <p className={`text-gray-900 font-semibold text-lg mb-4 ${pacifico.className}`}>
                    Response from {new Date(responses[currentResponseIndex].created).toLocaleString()}
                  </p>
                  <div className="space-y-4">
                    {responses[currentResponseIndex].answers.map((answer) => {
                      const question = questions.find((q) => q.questionid === answer.questionid);
                      return question && renderAnswerComponent(question, answer);
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className={`text-gray-600 text-lg text-center ${pacifico.className}`}>No responses yet</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}