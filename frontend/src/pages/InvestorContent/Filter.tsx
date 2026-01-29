// -------------------------------------------------------------
// Filter Component
// Displays a filter dropdown allowing users to select categories
// to refine the displayed ideas. Supports "All" selection, multi-
// selection, and applies filters through parent state handlers.
// -------------------------------------------------------------

import { FaCheckCircle } from "react-icons/fa";
import GradientButton from "../../component/GradientButton";
import { X } from "lucide-react";

// Props definition for managing filter state and behavior
interface FilterProps {
  showFilterDropdown: boolean;
  setShowFilterDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setAppliedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  ideasCount: number;
  filteredCount: number;
  categories: string[];
  setShowAll: React.Dispatch<React.SetStateAction<boolean>>;
}

const Filter: React.FC<FilterProps> = ({
  showFilterDropdown,
  setShowFilterDropdown,
  selectedCategories,
  setSelectedCategories,
  setAppliedCategories,
  ideasCount,
  filteredCount,
  categories,
  setShowAll,
}) => {
  
  // Hide component entirely if dropdown should not be shown
  if (!showFilterDropdown) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-end mr-23 mb-50">
      <div className="bg-white rounded-lg w-[550px] max-w-[90vw] overflow-hidden shadow-2xl">
        {/* Header section with title and close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b-gray-300 border-b ">
          <h2 className="text-lg font-bold text-gray-900 mr-9">Fields</h2>

          {/* Close dropdown button */}
          <button
            onClick={() => setShowFilterDropdown(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category selection section */}
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-3">
            {/* "All" option button */}
            <button
              className="px-3 py-2 rounded-full text-sm font-medium border flex items-center gap-2 border-gray-300 hover:border-gray-400 bg-white"
              onClick={() => setSelectedCategories([])}
            >
              <div className="flex items-center justify-center space-x-2">
                {selectedCategories.length === 0 && (
                  <FaCheckCircle className="w-4 h-4 text-[#1F7E90]" />
                )}
                <span
                  className={
                    selectedCategories.length === 0
                      ? "text-[#1F7E90] font-semibold"
                      : "text-gray-700"
                  }
                >
                  All
                </span>
              </div>
            </button>

            {/* Dynamically render category chips */}
            {categories.map((field) => (
              <button
                key={field}
                className="px-3 py-2 rounded-full text-sm font-medium border flex items-center gap-2 border-gray-300 hover:border-gray-400 bg-white"
                onClick={() =>
                  setSelectedCategories(
                    (prev) =>
                      prev.includes(field)
                        ? prev.filter((c) => c !== field) // remove category
                        : [...prev, field] // add category
                  )
                }
              >
                {/* Check icon appears only when selected */}
                {selectedCategories.includes(field) && (
                  <FaCheckCircle className="w-4 h-4 text-[#1F7E90]" />
                )}

                {/* Category label styling changes when selected */}
                <span
                  className={
                    selectedCategories.includes(field)
                      ? "text-[#1F7E90] font-semibold"
                      : "text-gray-700"
                  }
                >
                  {field}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apply filter button */}
        <div className="px-6 pb-5">
          <GradientButton
            onClick={() => {
              setAppliedCategories(selectedCategories); // apply filters
              setShowFilterDropdown(false); // close dropdown
              setShowAll(true); // show results section
            }}
          >
            Show {selectedCategories.length === 0 ? ideasCount : filteredCount}{" "}
            Results
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default Filter;
