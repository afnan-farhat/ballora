import React from "react";
import type { Tab } from "./Interfaces";

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => (
  /* Added 'scrollbar-hide' logic and 'w-full' to ensure container 
     takes full width on mobile 
  */
  <div className="flex w-full border-b-2 border-gray-200 overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabClick(tab.id)}
        /* Responsive Changes:
           - text-xs on mobile, text-sm/base on md+
           - px-3 on mobile, px-6 on md+
           - py-2 on mobile, py-3 on md+
        */
        className={`px-3 md:px-6 py-2 md:py-3 font-petrona font-semibold shrink-0 transition-all duration-200 ${
          activeTab === tab.id
            ? "text-[#33726D] border-b-2 border-[#33726D] -mb-[2px]"
            : "text-gray-500 hover:text-[#33726D]"
        } text-xs md:text-sm`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;