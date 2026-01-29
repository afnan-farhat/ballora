import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Download, Info, X } from "lucide-react";
import GradientButton from "../../../component/GradientButton";
import WhiteButton from "../../../component/WhiteButton";
import { useNavigate } from "react-router-dom";
import { getIdeas } from "../../../api";
import { jsPDF } from "jspdf";
import type { AddIdeaFormProps, RejectionTips, IdeaData } from '../../../component/Interfaces';

interface BusinessModel {
  [key: string]: string[];
}


const AddIdeaForm: React.FC<AddIdeaFormProps> = ({ }) => {
  const navigate = useNavigate();// React Router hook for page navigation

  // ------------------- Component States -------------------
  const [isEditable, setIsEditable] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isReadinessDropdownOpen, setIsReadinessDropdownOpen] = useState(false);
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // NEW: loading state
  const [summary, setSummary] = useState("");
  const [rejectionTips, setRejectionTips] = useState<RejectionTips | null>(null);
  const [fieldsError, setFieldsError] = useState<string>("");
  const [hasScrolledAll, setHasScrolledAll] = useState(false);
  const [invalidProblem, setInvalidProblem] = useState<string>("");
  const [invalidSolution, setInvalidSolution] = useState<string>("");
  const [invalidAdvantage, setInvalidAdvantage] = useState<string>("");


  const ideaNameRef = useRef<HTMLInputElement>(null);
  const problemRef = useRef<HTMLTextAreaElement>(null);
  const solutionRef = useRef<HTMLTextAreaElement>(null);
  const advantageRef = useRef<HTMLTextAreaElement>(null);
  const generateBtnRef = useRef<HTMLButtonElement>(null);
  const bmcRef = useRef<HTMLDivElement>(null);

  // Stores all user-entered form data
  
  const [formData, setFormData] = useState<IdeaData>({
    ideaName: '',
    problem: '',
    solution: '',
    readinessLevel: '',
    advantages: '',
    fields: [],
  });

  // ------------------- Static Dropdown Options -------------------

  const readinessLevels = ["Idea", "Prototype", "MVP", "growth/Expansion"];
  const fields = [
    "AI & Big Data",
    "Health & Biotechnology",
    "Education",
    "Environment & Sustainability",
    "Tourism & Entertainment",
    "Fintech & Business Services",
    "Retail & E-commerce",
    "Creative Industries",
    "Logistics & Supply Chain",
    "Smart Cities & Infrastructure",
    "Other",
  ];
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


  // ------------------- Auto-load first idea if exists -------------------

  useEffect(() => {
    // Fetch ideas from backend and show the first idea’s BMC if available

    const fetchData = async () => {
      // NOTE: getIdeas from your API is assumed to exist
      const ideasData = await getIdeas();
      const ideas = ideasData.ideas || []; // Ensure it handles { ideas: [] }
      if (ideas.length > 0) {
        setBusinessModel(ideas[0].bmc); // display first idea’s BMC
        setSummary(ideas[0].summary || "No summary available"); // Summary

      }
    };
    fetchData();
  }, []);


  
  // ------------------- VALIDATION PROCESS -------------------

  // ------------------- Send Idea Data to AI Backend -------------------
  const [errors, setErrors] = useState({
    ideaName: "",
    problem: "",
    solution: "",
    advantages: "",
    readinessLevel: "",
    fields: "",
  });

  // Prevent numeric-only input (e.g., "12345")
  const isOnlyNumbers = (text: string) => {
    return /^[0-9\s]+$/.test(text);
  };

  //Sending the idea info to AI to generate  business Model
  const validateForm = () => {
    const newErrors: any = {};

    // Idea Name — max 10 words
    const ideaWords = formData.ideaName.trim().split(/\s+/);
    if (!formData.ideaName.trim()) {
      newErrors.ideaName = "Idea name is required.";

    } else if (isOnlyNumbers(formData.ideaName)) {
      newErrors.ideaName = "Idea name must contain letters, not only numbers.";
    } else if (ideaWords.length > 10) {
      newErrors.ideaName = "Idea name must not exceed 10 words.";
    }

    // Problem — max 150 words
    const problemWords = formData.problem.trim().split(/\s+/);
    if (!formData.problem.trim()) {
      newErrors.problem = "Problem is required.";
    } else if (isOnlyNumbers(formData.problem)) {
      newErrors.problem = "Problem description must contain letters, not only numbers.";
    } else if (problemWords.length > 150) {
      newErrors.problem = "Problem must not exceed 150 words.";
    }

    // Solution — max 150 words
    const solutionWords = formData.solution.trim().split(/\s+/);
    if (!formData.solution.trim()) {
      newErrors.solution = "Solution is required.";
    } else if (isOnlyNumbers(formData.solution)) {
      newErrors.solution = "Solution must contain letters, not only numbers.";
    } else if (solutionWords.length > 150) {
      newErrors.solution = "Solution must not exceed 150 words.";
    }

    // Advantages — max 150 words
    const advantageWords = formData.advantages.trim().split(/\s+/);
    if (!formData.advantages.trim()) {
      newErrors.advantages = "Competitive advantage is required.";
    } else if (isOnlyNumbers(formData.advantages)) {
      newErrors.advantages = "Competitive advantage must contain letters, not only numbers.";
    } else if (advantageWords.length > 150) {
      newErrors.advantages = "Competitive advantage must not exceed 150 words.";
    }

    // Readiness level
    if (!formData.readinessLevel) {
      newErrors.readinessLevel = "Readiness level is required.";
    }

    // Fields
    if (!formData.fields.length) {
      newErrors.fields = "Please select at least one field.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------- Handlers -------------------

  // Adds or removes selected fields from the idea form
  const handlefieldsToggle = (field: string) => {
    setFormData((prev) => {
      const isOtherSelected = prev.fields.includes("Other");

      if (field === "Other") {
        if (isOtherSelected) {
          setFieldsError(""); // Clear error
          return { ...prev, fields: [] };
        } else {
          setFieldsError(""); // Clear error
          return { ...prev, fields: ["Other"] };
        }
      } else if (isOtherSelected) {
        return prev; // Can't select other if "Other" is selected
      } else {
        // Limit to max 2 selections
        if (!prev.fields.includes(field) && prev.fields.length >= 2) {
          setFieldsError(""); // Clear error if valid
          setFieldsError("You can select a maximum of 2 fields only.");
          return prev; // Do not add the new field
        } else {
          setFieldsError(""); // Clear error if valid
          const fields = prev.fields.includes(field)
            ? prev.fields.filter((f) => f !== field)
            : [...prev.fields, field];
          return { ...prev, fields };
        }
      }
    });
  };



  // ------------------- Generate Business Model PDF -------------------

  const handleDownloadPDF = () => {

    const doc = new jsPDF({ orientation: "landscape" });
    // Page layout setup

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const boxWidth = 60;
    const boxHeight = 50;
    const gap = 5;
    const cols = 3;
    const rows = 3;


    const totalWidth = cols * boxWidth + (cols - 1) * gap;
    const totalHeight = rows * boxHeight + (rows - 1) * gap;


    let startX = (pageWidth - totalWidth) / 2;
    let startY = (pageHeight - totalHeight) / 2;

    let x = startX;
    let y = startY;
    // let canvas_index = 0;
    // Standard BMC layout order (for reference only, actual data from backend is mapped dynamically)
    const bmc_order = ['key_partners', 'key_activities', 'key_resources', 'value_propositions',
      'customer_relationships', 'channels', 'customer_segments',
      'cost_structure', 'revenue_streams'];

    // Sort canvasData based on the standard BMC layout order
    const sortedCanvasData = bmc_order.map(key => {
      const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const text = businessModel && Array.isArray(businessModel[key]) ? (businessModel[key] as string[]).join('\n- ') : 'No data available';
      return { title, text };
    });

    sortedCanvasData.forEach((item, index) => {

      doc.rect(x, y, boxWidth, boxHeight);
      doc.setFontSize(10);
      doc.text(item.title, x + 2, y + 6);
      doc.setFontSize(8);
      // NOTE: Using doc.text with array of strings is better for alignment in a real scenario
      doc.text(item.text, x + 2, y + 12, { maxWidth: boxWidth - 4 });


      if ((index + 1) % cols === 0) {
        x = startX;
        y += boxHeight + gap;
      } else {
        x += boxWidth + gap;
      }
    });

    doc.save(`${formData.ideaName || "business Model Canvas"}.pdf`);
  };

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


  // ------------------- Form Handlers -------------------
  type FocusableElement = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;

  const handleEnterKey = (
    e: React.KeyboardEvent<FocusableElement>,
    nextRef: React.RefObject<FocusableElement | null>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const element = nextRef.current;
      if (!element) return;
      if (element instanceof HTMLButtonElement) {
        element.click();
      } else {
        element.focus();
      }
    }
  };

  // Handles scroll event in BMC container to check if user has scrolled to bottom
  const handleBMCScroll = () => {
    const container = bmcRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 5) { // add small offset
      setHasScrolledAll(true);
    }

  };

  // Handles selection of readiness level from dropdown
  const handleReadinessSelect = (readinessLevel: string) => {
    setFormData((prev) => ({ ...prev, readinessLevel }));
    setIsReadinessDropdownOpen(false);
  };

  // Re-enables editing mode and resets previous AI results
  const handleEdit = () => {
    setIsEditable(true);
    setShowButtons(false);
    setBusinessModel(null); // Clear model on edit
    setSummary(""); // Clear summary on edit
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setRejectionTips(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.status === "error") {
        alert(result.message);
        return;
      }

      if (result.status === "accepted") {
        setBusinessModel(result.businessModel);
        setSummary(result.summary);
        setShowButtons(true);
        setIsEditable(false);

        setInvalidProblem("");
        setInvalidSolution("");
        setInvalidAdvantage("");

      } else if (result.status === "rejected") {
        setRejectionTips(result);
        setBusinessModel(null);
        setSummary("");
        setIsEditable(true);

        setInvalidProblem("");
        setInvalidSolution("");
        setInvalidAdvantage("");

      } else if (result.status === "invalid") {

        setInvalidProblem(result.errors?.problem || "");
        setInvalidSolution(result.errors?.solution || "");
        setInvalidAdvantage(result.errors?.advantages || "");

        setBusinessModel(null);
        setSummary("");
        setRejectionTips(null);
        setIsEditable(true);
      }

    } catch (error) {
      console.error("Error generating BMC:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };


  // ------------------- Input Change + Form Submit -------------------

  // Updates formData state whenever user types in input or textarea
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  // ------------------- Styles -------------------

  const labelClass =
    "block text-base border-[#878787] font-semibold text-gray-800 mb-2 tracking-wide";

  const textareaClass = `w-full p-3 border-2 rounded-md focus:outline-none resize-none ${isEditable
    ? "bg-white border-gray-300 text-gray-700"
    : "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
    }`;
  // ------------------- JSX Rendering -------------------

  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-b from-transparent via-[#EEF9F8] to-transparent">
      <div className="max-w-7xl mx-auto px-6 py-20 pb-50">
        <div className="flex justify-center gap-8">
          <div className="flex-1 max-w-2xl p-6">
            <div className="space-y-6">

              <form style={{ marginBottom: '20px' }}>
                {/* Idea Name */}
                <div>
                  <label className={labelClass}>Idea Name</label>

                  <input ref={ideaNameRef} onKeyDown={(e) => handleEnterKey(e, problemRef)}

                    type="text" name="ideaName" value={formData.ideaName} onChange={handleChange} placeholder="Idea Name" className={textareaClass} disabled={!isEditable} />

                  {errors.ideaName && (
                    <p className="text-red-500 text-sm mt-1">{errors.ideaName}</p>
                  )}
                </div>
                <br></br>

                {/* Problem */}
                <div>
                  <label className={labelClass}>Problem</label>
                  <textarea name="problem" ref={problemRef} onKeyDown={(e) => handleEnterKey(e, solutionRef)}

                    value={formData.problem} onChange={handleChange} placeholder="Brief Description Of The Problem" rows={4} className={textareaClass} disabled={!isEditable} />
                  {errors.problem && (
                    <p className="text-red-500 text-sm mt-1">{errors.problem}</p>
                  )}

                </div>
                {invalidProblem && <p className="text-red-500 text-sm mt-1">{invalidProblem}</p>}

                <br></br>

                {/* Solution */}
                <div>
                  <label className={labelClass}>Solution</label>
                  <textarea
                    ref={solutionRef}
                    onKeyDown={(e) => handleEnterKey(e, advantageRef)}
                    name="solution"
                    value={formData.solution}
                    onChange={handleChange}
                    placeholder="Brief Summary of Proposed Solution"
                    rows={4}
                    className={textareaClass}
                    disabled={!isEditable}

                  />
                  {errors.solution && (
                    <p className="text-red-500 text-sm mt-1">{errors.solution}</p>
                  )}

                </div>
                {invalidSolution && <p className="text-red-500 text-sm mt-1">{invalidSolution}</p>}


                <br></br>


                {/* Competitive Advantage */}
                <div>
                  <label className={labelClass}>Competitive Advantage</label>
                  <textarea
                    ref={advantageRef}
                    onKeyDown={(e) => handleEnterKey(e, generateBtnRef)}
                    name="advantages"
                    value={formData.advantages}
                    onChange={handleChange}
                    placeholder="Advantages"
                    rows={4}
                    className={textareaClass}
                    disabled={!isEditable}
                  />
                  {errors.advantages && (
                    <p className="text-red-500 text-sm mt-1">{errors.advantages}</p>
                  )}

                </div>
                {invalidAdvantage && <p className="text-red-500 text-sm mt-1">{invalidAdvantage}</p>}

                <br></br>


                {/* Idea Levels Dropdown */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <label className={labelClass}>Idea Levels</label>
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                      className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
                    >
                      <Info className="w-4 h-4 mb-1.5" />
                    </button>

                  </div>
                  {showInfoTooltip && (
                    <div className="absolute top-6 left-0 w-64 bg-white text-gray-700 p-3 rounded-md shadow-lg z-20">
                      <p className="text-sm">
                        <b>Idea Level indicates the stage of your idea:</b>
                        <br /><b>- Idea:</b> Only have a concept in mind, nothing built yet.
                        <br /><b>- Prototype:</b> Created a simple draft or demo to show how your idea might work.
                        <br /><b>- MVP (Minimum Viable Product):</b> Built the first working version of your idea with only the core features to test with users.
                        <br /><b>- Growth/Expansion:</b> Ready for scale
                      </p>
                    </div>
                  )}

                  <button

                    onKeyDown={(e) => handleEnterKey(e, generateBtnRef)}


                    type="button"
                    onClick={() =>
                      isEditable && setIsReadinessDropdownOpen(!isReadinessDropdownOpen)
                    }
                    className={`w-full p-3 border-2 rounded-md flex items-center justify-between focus:outline-none ${isEditable
                      ? "bg-white text-gray-700 border-gray-300 cursor-pointer"
                      : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                      }`}
                    disabled={!isEditable}
                  >
                    <span>{formData.readinessLevel || "Select Level"}</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${isReadinessDropdownOpen ? "rotate-180" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isReadinessDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      {readinessLevels.map((readinessLevel) => (
                        <div
                          key={readinessLevel}
                          onClick={() => handleReadinessSelect(readinessLevel)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${formData.readinessLevel === readinessLevel
                            ? "bg-[#EEF9F8] text-[#006D81] border-l-4 border-l-[#006D81] font-semibold"
                            : "text-gray-700 font-semibold"
                            }`}
                        >
                          {readinessLevel}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.readinessLevel && (
                    <p className="text-red-500 text-sm">{errors.readinessLevel}</p>
                  )}

                </div>

                <br></br>

                {/* fields */}
                <div>
                  <label className={labelClass}>Idea Fields</label>
                  <div className="grid grid-cols-2 gap-3 p-3 border-2 border-gray-300  rounded-md bg-white">
                    {fields.map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          onKeyDown={(e) => handleEnterKey(e, generateBtnRef)}
                          type="checkbox"
                          checked={formData.fields.includes(field)}
                          onChange={() => handlefieldsToggle(field)}
                          disabled={!isEditable}
                          className="w-4 h-4 accent-[#3D6A89]"
                        />
                        <span className="text-gray-700 font-medium">{field}</span>
                      </label>
                    ))}
                  </div>
                  {fieldsError && <p className="text-red-500 text-sm mt-1">{fieldsError}</p>}
                  {errors.fields && (
                    <p className="text-red-500 text-sm mt-1">{errors.fields}</p>
                  )}

                </div>


                <br></br>
                {/* Generate Buttons */}
                <div>
                  <div className="flex gap-4 justify-end">
                    {!isEditable && (
                      <WhiteButton onClick={handleEdit} className="!px-10">
                        Edit
                      </WhiteButton>
                    )}
                    <GradientButton
                      ref={generateBtnRef}

                      onClick={handleGenerate}
                      disabled={!isEditable || isLoading}
                      className="!px-10"
                    >
                      {isLoading ? "Processing..." : "Generate"}
                    </GradientButton>
                  </div>

                </div>



              </form>

            </div>
          </div>

          {/* Right Side Preview */}
          <div className="flex-1">
            {/* Default message BEFORE clicking Generate */}
            {!isLoading && !businessModel && !rejectionTips && !summary && (
              <div className="flex flex-col items-center justify-center text-center flex-1">
                <div className="mt-64"></div>

                <img
                  src="/businessModel.png"
                  alt="Business Model"
                  className="w-20 h-16 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Business Model will appear after the idea is accepted
                </h3>
              </div>
            )}

            {/* Loading message AFTER clicking Generate */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center text-center flex-1 animate-pulse">

                <h3 className="text-lg text-gray-600 mt-64">
                  Generating Business Model Canvas and Summary...
                </h3>
              </div>
            )}


            {/* Idea Summary */}
            {summary && (
              <>
                <div className="w-150 bg-white rounded-lg shadow-md p-6 flex flex-col gap-4 overflow-y-auto">
                  <h3 className="text-xl font-bold mb-2">Idea Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{summary}</p>
                </div>
                <br></br>
              </>
            )}

            {/* Business Model Canvas */}
            {businessModel ? (
              <div className="w-150 bg-white h-[800px] rounded-lg shadow-md p-6 flex flex-col gap-4 overflow-y-auto" ref={bmcRef} onScroll={handleBMCScroll}>
                <h3 className="text-xl font-bold mb-4">Business Model Canvas</h3>

                {Object.entries(businessModel).map(([section, items]) => (
                  <div key={section} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2 capitalize">{section.replace(/_/g, ' ')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {Array.isArray(items) && items.length > 0
                        ? items.map((item, idx) => <li key={idx}>{item}</li>)
                        : <li>No data available</li>}
                    </ul>
                  </div>
                ))}


              </div>
            ) : (
              <div className="text-center mt-2 p-4">
                {/* Rejection Tips Display (NEW) */}
                {rejectionTips && (
                  <div className="w-150  h-[1130px]  bg-red-50 border border-red-300 rounded-lg shadow-xl p-6 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-red-700 mb-2">
                        Idea Rejected (Score: {rejectionTips.similarity_score})
                      </h3>
                      <button onClick={() => setRejectionTips(null)} className="text-red-500 hover:text-red-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-red-600 font-medium">Your idea is too similar to an existing one: **{rejectionTips.nearest_match}**.</p>

                    {Object.entries(rejectionTips.improvement_tips).map(([categoryKey, tips]) => (
                      <div key={categoryKey} className="p-3 bg-white rounded-md border border-red-200">
                        <h4 className="font-semibold text-red-700 mb-1 capitalize">
                          {categoryKey.replace(/_/g, ' ')}:
                        </h4>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-700 text-sm">
                          {Array.isArray(tips) && tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                        </ul>
                      </div>
                    ))}
                    <p className="text-sm italic text-red-500 mt-2">Please refine your idea and try generating again.</p>
                  </div>
                )}

              </div>


            )}

            {showButtons && (
              <div className="relative flex justify-center gap-4 mt-6 pr-6">
                <WhiteButton
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="flex items-center gap-2">
                    Download
                    <Download className="w-4 h-4" />
                  </span>
                </WhiteButton>

                <div className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}>
                  <GradientButton
                    className={`flex items-center gap-2 transition-opacity duration-200 ${!hasScrolledAll ? "cursor-not-allowed opacity-60" : ""}`}
                    onClick={() =>
                      hasScrolledAll &&
                      navigate("/SubmitIdea", {
                        state: {
                          businessModel: businessModel,
                          ideaData: {
                            ideaName: formData.ideaName,
                            problem: formData.problem,
                            solution: formData.solution,
                            advantages: formData.advantages,
                            readinessLevel: formData.readinessLevel,
                            fields: formData.fields,
                            summary: summary,
                          },
                        },
                      })
                    }
                  >
                    Next
                  </GradientButton>

                  {/* Tooltip message always rendered */}
                  {!hasScrolledAll && showTooltip && (
                    <div className="absolute bottom-full mb-2 w-64 bg-yellow-100 text-yellow-800 text-sm p-2 rounded-md shadow-lg">
                      Please scroll through the entire Business Model Canvas to enable the Next button.
                    </div>
                  )}
                </div>


              </div>

            )}
          </div>
        </div>

      </div>



    </section>
  );
};

export default AddIdeaForm; 