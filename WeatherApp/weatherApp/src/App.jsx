import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import TopTabs from "./components/TopTabs";
import TodayGrid from "./components/TodayGrid";
import WeekGrid from "./components/WeekGrid";
import Highlights from "./components/Highlights";
import { API_KEY, BASE_URL, getConditionConfig, cToF } from "./utils/weatherConfig";
import "./App.css";

const App = () => {
  const [city, setCity] = useState("Delhi");
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [isCelsius, setIsCelsius] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(
          `${BASE_URL}/${city}?unitGroup=metric&key=${API_KEY}&contentType=json`
        );
        
        const data = response.data;

        // 🔹 Prepare structured data
        const current = {
          temp: data.currentConditions.temp,
          tempF: cToF(data.currentConditions.temp),
          icon: data.currentConditions.icon,
          formattedDateTime: new Date().toLocaleString("en-US", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
          }),
          conditions: data.currentConditions.conditions,
          precipprob: data.currentConditions.precip,
          windspeed: data.currentConditions.windspeed,
          humidity: data.currentConditions.humidity,
          visibility: data.currentConditions.visibility,
        };

        // 🔹 Today’s sunrise & sunset (first day)
        const today = {
          sunrise: data.days[0].sunrise,
          sunset: data.days[0].sunset,
        };

        // 🔹 Hourly data (Today - API expects fallback)
        const hours = (data.days[0].hours || []).map((hour) => ({
          datetimeEpoch: hour.datetimeEpoch,
          datetime: hour.datetime,
          icon: hour.icon,
          temp: hour.temp,
          tempF: cToF(hour.temp),
        }));

        // 🔹 Weekly data (7 days)
        const days = data.days.slice(0, 7).map((day) => ({
          datetimeEpoch: day.datetimeEpoch,
          temp: day.temp,
          tempF: cToF(day.temp),
          icon: day.icon,
          dayName: new Date(day.datetime).toLocaleDateString("en-US", {
            weekday: "short",
          }),
        }));

        // 🔹 Save data
        setWeatherData({ current, today, hours, days,  location: data.resolvedAddress  });
      } catch (err) {
        setError("City not found, please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [city]); 

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setCity(searchValue.trim());
      setSearchValue("");
    }
  };

  if (loading) return <div className="loading">⛅ Loading weather data...</div>;
  if (error) return <div className="error">{error}</div>;

  const { current, today, hours, days } = weatherData;
  const bgConfig = getConditionConfig(current.icon);

  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${bgConfig.background})` }}
    >
      

      <div className="app-card">
        <Sidebar
          city={city}
          location={weatherData.location} 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearchSubmit}
          current={current}
          isCelsius={isCelsius}
        />

        <main className="main">
          <TopTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCelsius={isCelsius}
            setIsCelsius={setIsCelsius}
          />

          {activeTab === "today" ? (
            <TodayGrid hours={hours} isCelsius={isCelsius} />
          ) : (
            <WeekGrid days={days} isCelsius={isCelsius} />
          )}

          <Highlights current={current} today={today} />
          <footer className="credit">
  Weather Prediction App — <span>by Arun Sriramoju</span>
</footer>
        </main>
      </div>
   
    </div>
    
  );
};

export default App;
