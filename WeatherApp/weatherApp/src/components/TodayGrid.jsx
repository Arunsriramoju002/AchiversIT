
import React from "react";
import { getConditionConfig } from "../utils/weatherConfig";

const TodayGrid = ({ hours, isCelsius }) => {
  if (!hours || hours.length === 0) return null;

  return (
    <div className="cards-grid">
      {hours.slice(0, 24).map((hour) => {
        const iconConfig = getConditionConfig(hour.icon);
        const timeLabel = hour.datetime; 
        const temp = isCelsius ? hour.temp : hour.tempF;

        return (
          <div key={hour.datetimeEpoch} className="weather-card">
            <div className="weather-card-time">{timeLabel}</div>
            <img
              src={iconConfig.icon}
              alt={hour.icon}
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

export default TodayGrid;
