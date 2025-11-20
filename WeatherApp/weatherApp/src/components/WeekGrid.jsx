
import React from "react";
import { getConditionConfig } from "../utils/weatherConfig";

const WeekGrid = ({ days, isCelsius }) => {
  if (!days || days.length === 0) return null;

  return (
    <div className="cards-row">
      {days.slice(0, 7).map((day, index) => {
        const iconConfig = getConditionConfig(day.icon);
        const temp = isCelsius ? day.temp : day.tempF;
        const label = index === 0 ? "Today" : day.dayName; 

        return (
          <div key={day.datetimeEpoch} className="weather-card week-card">
            <div className="weather-card-time">{label}</div>
            <img
              src={iconConfig.icon}
              alt={day.icon}
              className="weather-card-icon"
            />
            <div className="weather-card-temp">
              {Math.round(temp)}
              {isCelsius ? "°C" : "°F"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekGrid;
