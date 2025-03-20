// npm install sam-js
import { Agent, Action } from "sam-js";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  throw new Error("WEATHER_API_KEY environment variable not set");
}

const agent = new Agent({
  broker: {
    url: "ws://localhost:8008",
    vpn: "default",
    username: "default",
    password: "default",
  },
  agent: {
    name: "weather",
    description:
      "A weather agent that provides current conditions and forecasts",
    alwaysOpen: true,
  },
  config: {
    samNamespace: "test/",
  },
});

const getWeather = new Action(
  {
    name: "getWeather",
    description: "Get the current weather for a given location",
    params: [{ name: "location", desc: "The location to get the weather for" }],
  },
  async (params, meta) => {
    console.log(`Getting weather for ${params.location}`);
    try {
      const location = params.location as string;
      const weatherUrl = `https://api.weatherapi.com/v1/current.json?q=${encodeURIComponent(
        location
      )}&key=${WEATHER_API_KEY}`;
      const response = await fetch(weatherUrl);

      if (!response.ok) {
        return {
          message: `Weather API returned status code ${response.status}`,
        };
      }

      const jsonResponse = (await response.json()) as {
        current: { [key: string]: unknown };
      };
      return {
        message: JSON.stringify(jsonResponse.current || {}),
      };
    } catch (error) {
      console.error(`Error fetching weather data: ${(error as Error).message}`);
      return {
        message: `Error fetching weather data: ${(error as Error).message}`,
      };
    }
  }
);

const getForecast = new Action(
  {
    name: "getForecast",
    description: "Get the weather forecast for a given location",
    params: [
      { name: "location", desc: "The location to get the forecast for" },
      {
        name: "days",
        desc: "Number of days for the forecast (1-10), default 3",
      },
    ],
  },
  async (params, meta) => {
    try {
      const days = parseInt(params.days as string) || 3;
      const location = params.location as string;
      console.log(`Getting ${days}-day forecast for ${location}`);
      const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?q=${encodeURIComponent(
        location
      )}&days=${days}&alerts=no&aqi=no&tp=24&key=${WEATHER_API_KEY}`;
      const response = await fetch(forecastUrl);

      if (!response.ok) {
        return {
          message: `Weather API returned status code ${response.status}`,
        };
      }

      const jsonResponse = (await response.json()) as {
        forecast: { [key: string]: unknown };
      };
      return {
        message: JSON.stringify(jsonResponse.forecast || {}),
      };
    } catch (error) {
      return {
        message: `Error fetching forecast data: ${(error as Error).message}`,
      };
    }
  }
);

agent.addAction(getWeather);
agent.addAction(getForecast);

agent.run();

console.log("Weather agent started with current and forecast capabilities");
