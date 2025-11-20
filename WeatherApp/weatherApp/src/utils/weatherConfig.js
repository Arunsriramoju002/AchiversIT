

export const API_KEY = "EJ6UBL2JEQGYB3AA4ENASN62J"; 

export const BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

export const conditionConfig = {
  "partly-cloudy-day": {
    icon: "https://i.ibb.co/PZQXH8V/27.png",
    background: "https://i.ibb.co/qNv7NxZ/pc.webp",
  },
  "partly-cloudy-night": {
    icon: "https://i.ibb.co/Kzkk59k/15.png",
    background: "https://i.ibb.co/RDfPqXz/pcn.jpg",
  },
  rain: {
    icon: "https://i.ibb.co/kBd2NTS/39.png",
    background: "https://i.ibb.co/h2p6Yhd/rain.webp",
  },
  "clear-day": {
    icon: "https://i.ibb.co/rb4rrJL/26.png",
    background: "https://i.ibb.co/WGry01m/cd.jpg",
  },
  "clear-night": {
    icon: "https://i.ibb.co/1nxNGHL/10.png",
    background: "https://i.ibb.co/kqtZ1Gx/cn.jpg",
  },
  default: {
    icon: "https://i.ibb.co/rb4rrJL/26.png",
    background: "https://i.ibb.co/qNv7NxZ/pc.webp",
  },
};

export function getConditionConfig(icon) {
  return conditionConfig[icon] || conditionConfig.default;
}

export function cToF(c) {
  return (c * 9) / 5 + 32;
}
