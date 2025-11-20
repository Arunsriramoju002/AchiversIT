import React from "react";
import { getConditionConfig } from "../utils/weatherConfig";

const Sidebar = ({
  location,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  current,
  isCelsius,
}) => {
  const iconConfig = getConditionConfig(current?.icon);

  const temp = current
    ? isCelsius
      ? `${Math.round(current.temp)}°C`
      : `${Math.round(current.tempF)}°F`
    : "--";

  const dateTime = current?.formattedDateTime || "--";
  const description = current?.conditions || "";
  const precip = current?.precipprob ?? 0;

  return (
    <aside className="sidebar">
      <form className="search-bar" onSubmit={onSearchSubmit}>
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button type="submit" aria-label="Search" />
      </form>

      <div className="sidebar-icon-wrapper">
        <img
          src={iconConfig.icon}
          alt={current?.icon || "weather icon"}
          className="sidebar-icon"
        />
      </div>

      <div className="sidebar-temp">{temp}</div>

      <div className="sidebar-date">{dateTime}</div>
      <div className="sidebar-divider" />

      <div className="sidebar-desc">{description}</div>
      <div className="sidebar-precip">Perc - {Math.round(precip)}%</div>

      <div className="sidebar-location">{location}</div>
    </aside>
  );
};

export default Sidebar;
