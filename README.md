# Solace-Agent-Mesh Agent JS SDK

This is a JavaScript SDK for creating agents for the [Solace-Agent-Mesh](https://github.com/SolaceLabs/solace-agent-mesh).

Supported Features:

-------------------
| Feature | Supported |
|---------|-----------|
| Agent Registration | ✅       |
| Adding Actions | ✅        |
| File Response | ❌       |
| LLM Request | ❌       |
| Embedding Request | ❌       |
| Middlewares | ❌       |
| FileService Access | ❌       |


## Usage Example - Weather Agent

This agent provides weather information using the weatherapi.com API.

Check [example.ts](./example.ts) for the full code.

## Setup

1. Clone this repository
2. Install dependencies: (requires NodeJS version 20.0 or higher)
   ```bash
   npm install
   ```

3. Set your Weather API key as an environment variable:
   ```bash
   export WEATHER_API_KEY="your_api_key_here"
   ```

   Or create a `.env` file in the root directory:
   ```
   WEATHER_API_KEY=your_api_key_here
   ```

4. Start the agent:
   ```bash
   cd sam-js-sdk
   ts-node example.ts
   ```

### Available Actions

#### getWeather

Gets the current weather for a location.

Parameters:
- `location`: The location to get weather for (city name, zip code, coordinates, etc.)

Example:
```json
{
  "location": "San Francisco, CA"
}
```

#### getForecast

Gets a multi-day weather forecast for a location.

Parameters:
- `location`: The location to get forecast for
- `days`: Number of forecast days (1-10, default: 3)

Example:
```json
{
  "location": "San Francisco, CA",
  "days": 5
}
```


