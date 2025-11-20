
import React from "react";

const HighlightCard = ({ title, value, label, extra }) => (
  <div className="highlight-card">
    <div className="highlight-title">{title}</div>
    <div className="highlight-value">{value}</div>
    {extra && <div className="highlight-extra">{extra}</div>}
    {label && <div className="highlight-label">{label}</div>}
  </div>
);

const Highlights = ({ current, today }) => {
  if (!current || !today) return null;

  return (
    <section className="highlights">
      <h2 className="highlights-heading">Today&apos;s Highlights</h2>

      <div className="highlights-grid">
        <HighlightCard
          title="UV Index"
          value={current.uvIndex ?? 3}
          label="Moderate"
        />

        <HighlightCard
          title="Wind Status"
          value={`${current.windspeed ?? "--"} km/h`}
        />

        <HighlightCard
          title="Sunrise & Sunset"
          value={today.sunrise || "--"}
          extra={today.sunset || "--"}
        />

        <HighlightCard
          title="Humidity"
          value={`${current.humidity ?? "--"}%`}
          label="High"
        />

        <HighlightCard
          title="Visibility"
          value={`${current.visibility ?? "--"} km`}
          label="Very clear air"
        />

        <HighlightCard
          title="Air Quality"
          value={current.airQuality ?? 26.5}
          label="Good ✌"
        />
      </div>
    </section>
  );
};

export default Highlights;
