import React from "react";
import type { Tab } from "./Interfaces"; 



// Props for the Tabs component
interface TabsProps {
  tabs: Tab[]; // List of tabs to display
  activeTab: string; // Currently active tab ID
  onTabClick: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => (
  // Tabs container with bottom border
  <div className="flex border-b-2 border-gray-200">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabClick(tab.id)}
        className={`px-6 py-3 font-petrona font-semibold ${
          activeTab === tab.id
            ? "text-[#33726D] border-b-2 border-[#33726D] -mb-0.5"
            : "text-gray-700 hover:text-[#33726D]"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
