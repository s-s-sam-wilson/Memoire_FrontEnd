"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pacifico, Raleway } from "next/font/google";

import MCQ from "../../Component/question/MCQ";
import MSQ from "../../Component/question/MSQ";
import ShortAnswer from "../../Component/question/ShortAnswer";
import Paragraph from "../../Component/question/Paragraph";
import ImageUpload from "../../Component/question/ImageUpload";
import DatePicker from "../../Component/question/DatePicker";
import Bottle from "../../Component/question/Bottle";
import Signature from "../../Component/question/Signature";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const raleway = Raleway({ subsets: ["latin"], weight: "400" });

function SortableItem({ id, question, index, onDelete, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex justify-between items-center p-3 hover:bg-gray-100 rounded-xl cursor-pointer bg-white shadow-sm border border-gray-200 transition duration-300"
      onClick={onClick}
    >
      <span className={`${raleway.className} text-gray-600 text-sm md:text-base`}>
        Question {index + 1}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(question.questionid);
        }}
        className={`${raleway.className} text-pink-500 text-sm md:text-base hover:text-pink-700 transition duration-200`}
      >
        Delete
      </button>
    </div>
  );
}

export default function SlambookDetail() {
  const [slambook, setSlambook] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    questiontext: "",
    type: "Text_One",
    max_selection: 0,
    is_required: false,
    options: ["", ""],
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const router = useRouter();
  const { slamid } = useParams();

  const questionTypeMap = {
    MCQ: "Multiple Choice (Single Answer)",
    MSQ: "Multiple Choice (Multiple Answers)",
    Text_One: "Short Answer",
    Text_multi: "Paragraph",
    IMAGE: "Image Upload",
    DATE: "Date Picker",
    Bottle: "Slider (Select Value)",
    Sign: "Signature",
  };

  const questionTypes = [
    "MCQ",
    "MSQ",
    "Text_One",
    "Text_multi",
    "IMAGE",
    "DATE",
    "Bottle",
    "Sign",
  ];

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    const fetchSlambookData = async () => {
      try {
        const slambookResponse = await axios.get(`https://memoire.pythonanywhere.com/slambook/${slamid}/`, {
          withCredentials: true,
        });
        setSlambook(slambookResponse.data);
        setNewTitle(slambookResponse.data.slamtitle);

        const questionsResponse = await axios.get(
          `https://memoire.pythonanywhere.com/slambook/${slamid}/question`,
          { withCredentials: true }
        );

        const questionsWithOptions = await Promise.all(
          questionsResponse.data.map(async (question) => {
            if (question.type === "MCQ" || question.type === "MSQ") {
              const optionsResponse = await axios.get(
                `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${question.questionid}/option`,
                { withCredentials: true }
              );
              return {
                ...question,
                options: optionsResponse.data.map((option) => option.optiontext),
              };
            }
            return question;
          })
        );

        setQuestions(questionsWithOptions);
      } catch (err) {
        setError("Error loading slambook details");
        if (err.response?.status === 401) router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchSlambookData();
  }, [slamid, router]);

  const handleGenerateShareUrl = async () => {
    try {
      const response = await axios.get(`https://memoire.pythonanywhere.com/slambook/${slamid}/share`, {
        withCredentials: true,
      });
      const urlid = response.data.urlid;
      const shareableLink = `${window.location.origin}/slam/${urlid}`;
      setShareUrl(shareableLink);

      if (navigator.share) {
        await navigator.share({
          title: slambook.slamtitle,
          text: "Check out my slambook!",
          url: shareableLink,
        });
      } else {
        setIsShareModalOpen(true);
      }
    } catch (err) {
      setError("Failed to generate or share URL");
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    let adjustedMaxSelection = newQuestion.max_selection;
    if (newQuestion.type === "MCQ") adjustedMaxSelection = 1;
    else if (newQuestion.type === "MSQ")
      adjustedMaxSelection = newQuestion.options.filter((opt) => opt.trim()).length || 0;

    try {
      if (editingQuestionId) {
        // Update the question
        const questionResponse = await axios.put(
          `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${editingQuestionId}`,
          { ...newQuestion, slamid: slamid, max_selection: adjustedMaxSelection },
          { withCredentials: true }
        );

        let updatedQuestion = questionResponse.data;

        if (newQuestion.type === "MCQ" || newQuestion.type === "MSQ") {
          // Fetch existing options
          const existingOptionsResponse = await axios.get(
            `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${editingQuestionId}/option`,
            { withCredentials: true }
          );
          const existingOptions = existingOptionsResponse.data;

          // Delete options that are no longer present
          const newOptionsSet = new Set(newQuestion.options.filter((opt) => opt.trim()));
          const optionsToDelete = existingOptions.filter(
            (opt) => !newOptionsSet.has(opt.optiontext)
          );
          await Promise.all(
            optionsToDelete.map((opt) =>
              axios.delete(
                `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${editingQuestionId}/option/${opt.optionid}`,
                { withCredentials: true }
              )
            )
          );

          // Add new options (even if all were deleted)
          const existingOptionsSet = new Set(existingOptions.map((opt) => opt.optiontext));
          const optionsToAdd = newQuestion.options.filter(
            (opt) => opt.trim() && !existingOptionsSet.has(opt)
          );
          const optionPromises = optionsToAdd.map((optionText) =>
            axios.post(
              `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${editingQuestionId}/option`,
              { optiontext: optionText },
              { withCredentials: true }
            )
          );
          await Promise.all(optionPromises);

          // Fetch updated options after adding/deleting
          const updatedOptionsResponse = await axios.get(
            `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${editingQuestionId}/option`,
            { withCredentials: true }
          );
          updatedQuestion.options = updatedOptionsResponse.data.map((opt) => opt.optiontext);
        }

        setQuestions(questions.map((q) => (q.questionid === editingQuestionId ? updatedQuestion : q)));
      } else {
        // Create a new question
        const questionResponse = await axios.post(
          `https://memoire.pythonanywhere.com/slambook/${slamid}/question`,
          {
            ...newQuestion,
            slamid: parseInt(slamid),
            max_selection: adjustedMaxSelection,
            sequence: questions.length,
          },
          { withCredentials: true }
        );

        let updatedQuestion = questionResponse.data;
        if (newQuestion.type === "MCQ" || newQuestion.type === "MSQ") {
          const optionsToCreate = newQuestion.options.filter((opt) => opt.trim());
          const optionPromises = optionsToCreate.map((optionText) =>
            axios.post(
              `https://memoire.pythonanywhere.com/slambook/${slamid}/question/${questionResponse.data.questionid}/option`,
              { optiontext: optionText },
              { withCredentials: true }
            )
          );
          const optionsResponses = await Promise.all(optionPromises);
          updatedQuestion.options = optionsResponses.map((res) => res.data.optiontext);
        }

        setQuestions([...questions, updatedQuestion]);
      }

      setNewQuestion({
        questiontext: "",
        type: "Text_One",
        max_selection: 0,
        is_required: false,
        options: ["", ""],
      });
      setEditingQuestionId(null);
      setIsSidebarOpen(false);
    } catch (err) {
      setError(editingQuestionId ? "Failed to update question" : "Failed to add question");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewQuestion((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOptionChange = (index, value) => {
    setNewQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const deleteQuestion = async (questionId) => {
    try {
      await axios.delete(`https://memoire.pythonanywhere.com/slambook/${slamid}/question/${questionId}`, {
        withCredentials: true,
      });
      const updatedQuestions = questions
        .filter((q) => q.questionid !== questionId)
        .map((q, index) => ({ ...q, sequence: index }));
      setQuestions(updatedQuestions);
      await axios.put(
        `https://memoire.pythonanywhere.com/slambook/${slamid}/question`,
        updatedQuestions.map((q) => ({ questionid: q.questionid, sequence: q.sequence })),
        { withCredentials: true }
      );
    } catch (err) {
      setError("Failed to delete question");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.questionid === active.id);
    const newIndex = questions.findIndex((q) => q.questionid === over.id);

    const reorderedQuestions = Array.from(questions);
    const [movedQuestion] = reorderedQuestions.splice(oldIndex, 1);
    reorderedQuestions.splice(newIndex, 0, movedQuestion);

    const updatedQuestions = reorderedQuestions.map((q, index) => ({
      ...q,
      sequence: index,
    }));

    setQuestions(updatedQuestions);

    try {
      await axios.put(
        `https://memoire.pythonanywhere.com/slambook/${slamid}/question`,
        updatedQuestions.map((q) => ({ questionid: q.questionid, sequence: q.sequence })),
        { withCredentials: true }
      );
    } catch (err) {
      setError("Failed to save question order");
      setQuestions(questions);
    }
  };

  const handleEditClick = (questionId) => {
    const questionToEdit = questions.find((q) => q.questionid === questionId);
    setNewQuestion({
      questiontext: questionToEdit.questiontext,
      type: questionToEdit.type,
      max_selection: questionToEdit.max_selection,
      is_required: questionToEdit.is_required,
      options: questionToEdit.options?.length > 0 ? [...questionToEdit.options] : ["", ""],
    });
    setEditingQuestionId(questionId);
  };

  const handleTitleChange = async () => {
    try {
      const response = await axios.put(
        `https://memoire.pythonanywhere.com/slambook/${slamid}/`,
        { slamtitle: newTitle },
        { withCredentials: true }
      );
      setSlambook(response.data);
      setIsEditingTitle(false);
    } catch (err) {
      setError("Failed to update slambook title");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFD3A5] to-[#FD6585]">
        <p className={`${pacifico.className} text-2xl text-gray-900 font-semibold animate-pulse`}>
          Loading...
        </p>
      </div>
    );

  return (
    <div
      className={`${raleway.className} min-h-screen bg-gradient-to-br from-[#FFF3E6] to-[#FDE2E4] flex flex-col md:flex-row text-gray-900`}
    >
      <div className="md:hidden p-4 bg-white shadow-md flex justify-between items-center rounded-b-lg">
        <h2 className={`${pacifico.className} text-xl text-gray-800 font-semibold`}>
          <a href="/" onClick={(e) => { e.preventDefault(); router.push("/"); }} className="hover:text-gray-600 transition duration-200">Memoire</a>
        </h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
        >
          {isSidebarOpen ? "Close" : "Menu"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          className={`${isSidebarOpen ? "block" : "hidden"} md:block w-full md:w-72 bg-white p-6 shadow-md md:h-screen border-r border-gray-200`}
        >
          <h2 className={`${pacifico.className} text-xl text-gray-800 font-semibold mb-6 hidden md:block`}>
            Your Questions
          </h2>
          <SortableContext
            items={questions.map((q) => q.questionid)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((q, index) => (
              <SortableItem
                key={q.questionid}
                id={q.questionid}
                question={q}
                index={index}
                onDelete={deleteQuestion}
                onClick={() => handleEditClick(q.questionid)}
              />
            ))}
          </SortableContext>
          <button
            onClick={() => {
              setNewQuestion({
                questiontext: "",
                type: "Text_One",
                max_selection: 0,
                is_required: false,
                options: ["", ""],
              });
              setEditingQuestionId(null);
            }}
            className="mt-6 w-full bg-pink-500 text-white px-6 py-2 rounded-full font-medium hover:bg-pink-600 transition duration-300 shadow-md"
          >
            + New Question
          </button>
        </div>
      </DndContext>

      <div className="flex-1 p-6 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
      {slambook && (
  <div className="mb-8">
    {isEditingTitle ? (
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={`${pacifico.className} text-2xl md:text-3xl text-gray-800 border-b-2 border-pink-400 focus:outline-none focus:border-pink-600 bg-white p-2 rounded-xl shadow-sm w-full`}
          autoFocus
        />
        <div className="flex space-x-3">
          <button
            onClick={handleTitleChange}
            className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition duration-300 shadow-md"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditingTitle(false);
              setNewTitle(slambook.slamtitle);
            }}
            className="text-gray-700 hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between md:justify-start space-x-3">
          <h1
            className={`${pacifico.className} text-2xl md:text-3xl font-bold text-gray-800 truncate max-w-[60%] md:max-w-none`}
          >
            {slambook.slamtitle}
          </h1>
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-gray-600 hover:text-gray-800 transition duration-200 text-sm md:text-base"
          >
            Edit
          </button>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateShareUrl}
            className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition duration-300 shadow-md text-sm md:text-base w-auto"
          >
            Share
          </button>
          <button
            onClick={() => router.push(`/slambook/${slamid}/responses`)}
            className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition duration-300 shadow-md text-sm md:text-base w-auto"
          >
            View Responses
          </button>
        </div>
      </div>
    )}
    <p className="text-sm text-gray-600 mt-2">
      Created: {new Date(slambook.created).toLocaleDateString()}
    </p>
  </div>
)}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 shadow-sm text-center border border-red-300">
            {error}
          </div>
        )}

        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className={`${pacifico.className} text-xl text-gray-800 font-semibold mb-4`}>
                Share Your Slambook
              </h2>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Copy this link to share your slambook:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full p-2 border border-gray-200 rounded-xl text-sm md:text-base bg-gray-50"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Link copied to clipboard!");
                  }}
                  className="bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 transition duration-300 shadow-md"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="mt-4 w-full text-gray-700 font-medium hover:text-gray-900 transition duration-200 bg-gray-200 px-4 py-2 rounded-full shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className={`${pacifico.className} text-xl text-gray-800 font-semibold mb-6`}>
            {editingQuestionId ? "Edit Question" : "Add Question"}
          </h2>
          <form onSubmit={handleQuestionSubmit}>
            <div className="mb-6">
              <input
                type="text"
                name="questiontext"
                value={newQuestion.questiontext}
                onChange={handleInputChange}
                placeholder="Enter your question"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm md:text-base bg-gray-50"
                required
              />
            </div>
            <div className="mb-6">
              <select
                name="type"
                value={newQuestion.type}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm md:text-base bg-gray-50"
              >
                {questionTypes.map((type) => (
                  <option key={type} value={type}>
                    {questionTypeMap[type]}
                  </option>
                ))}
              </select>
            </div>
            {(newQuestion.type === "MCQ" || newQuestion.type === "MSQ") && (
              <div className="mb-6">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex mb-3 items-center">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full p-2 border border-gray-200 rounded-xl text-sm md:text-base bg-gray-50"
                    />
                    {index > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index),
                          }))
                        }
                        className="ml-2 text-pink-500 hover:text-pink-700 text-sm md:text-base transition duration-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-pink-600 hover:text-pink-700 text-sm md:text-base transition duration-200 underline"
                >
                  + Add Option
                </button>
              </div>
            )}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_required"
                  checked={newQuestion.is_required}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 md:h-5 md:w-5 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-sm md:text-base text-gray-700">Required</span>
              </label>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
              <button
                type="submit"
                className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition duration-300 shadow-md text-base"
              >
                {editingQuestionId ? "Update Question" : "Add Question"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewQuestion({
                    questiontext: "",
                    type: "Text_One",
                    max_selection: 0,
                    is_required: false,
                    options: ["", ""],
                  });
                  setEditingQuestionId(null);
                }}
                className="text-gray-700 hover:text-gray-900 transition duration-200 bg-gray-200 px-6 py-2 rounded-full shadow-sm text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8">
          <h2 className={`${pacifico.className} text-xl text-gray-800 font-semibold mb-6`}>
            Preview
          </h2>
          {questions.length > 0 ? (
            questions.map((q) => {
              const QuestionComponent = questionComponents[q.type];
              return (
                <div
                  key={q.questionid}
                  className="bg-white p-6 rounded-xl shadow-md mb-4 border border-gray-200 hover:shadow-lg transition duration-300"
                >
                  <QuestionComponent
                    questiontext={q.questiontext}
                    options={q.options || []}
                    is_required={q.is_required}
                  />
                  <p className="text-sm text-gray-500 mt-2">Type: {questionTypeMap[q.type]}</p>
                  {q.max_selection > 0 && (
                    <p className="text-sm text-gray-500">Max selections: {q.max_selection}</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className={`${pacifico.className} text-gray-600 text-lg text-center`}>
              No questions yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}