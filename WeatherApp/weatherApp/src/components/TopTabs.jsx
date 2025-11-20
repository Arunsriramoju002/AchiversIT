
import React from "react";

const TopTabs = ({ activeTab, setActiveTab, isCelsius, setIsCelsius }) => {
  return (
    <div className="top-bar">
      <div className="tab-switch">
        <button
          className={activeTab === "today" ? "tab active" : "tab"}
          onClick={() => setActiveTab("today")}
        >
          Today
        </button>
        <button
          className={activeTab === "week" ? "tab active" : "tab"}
          onClick={() => setActiveTab("week")}
        >
          Week
        </button>
      </div>

      <div className="unit-toggle">
        <button
          className={isCelsius ? "unit active" : "unit"}
          onClick={() => setIsCelsius(true)}
        >
          °C
        </button>
        <button
          className={!isCelsius ? "unit active" : "unit"}
          onClick={() => setIsCelsius(false)}
        >
          °F
        </button>
      </div>
    </div>
  );
};

export default TopTabs;
