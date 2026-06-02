import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import {
  fetchWeather,
  calculateWateringScore,
  hasFrostRisk,
  getFrostTimes,
  getWeatherDescription,
} from "../weatherService";
import type { WeatherData } from "../weatherService";

const mockWeatherData: WeatherData = {
  latitude: 52.52,
  longitude: 13.41,
  timezone: "Europe/Berlin",
  current: {
    temperature_2m: 22,
    relative_humidity_2m: 65,
    precipitation: 0,
    weather_code: 0,
    wind_speed_10m: 10,
  },
  hourly: {
    time: [
      "2024-06-01T00:00",
      "2024-06-01T01:00",
      "2024-06-01T02:00",
      "2024-06-01T03:00",
      "2024-06-01T04:00",
      "2024-06-01T05:00",
      "2024-06-01T06:00",
      "2024-06-01T07:00",
      "2024-06-01T08:00",
      "2024-06-01T09:00",
      "2024-06-01T10:00",
    ],
    temperature_2m: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
    relative_humidity_2m: [80, 82, 85, 87, 89, 90, 91, 92, 93, 94, 95],
    precipitation: [0, 0, 0, 0, 0, 0, 0, 0, 0.5, 1, 2],
    et0_fao_evapotranspiration: [
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
    dew_point_2m: [10, 10, 10, 9, 9, 8, 7, 6, 5, 4, 3],
    wind_speed_10m: [5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10],
  },
  daily: {
    time: ["2024-06-01", "2024-06-02"],
    temperature_2m_max: [22, 20],
    temperature_2m_min: [10, 8],
    precipitation_sum: [0.5, 2],
  },
};

const mockFetch = vi.fn();
const mockClearTimeout = vi.fn();
const mockSetTimeout = vi.fn(() => 42);

describe("getWeatherDescription", () => {
  it("returns 'Clear sky' for code 0", () => {
    expect(getWeatherDescription(0)).toBe("Clear sky");
  });

  it("returns 'Cloudy' for codes 1-3", () => {
    expect(getWeatherDescription(1)).toBe("Cloudy");
    expect(getWeatherDescription(2)).toBe("Cloudy");
    expect(getWeatherDescription(3)).toBe("Cloudy");
  });

  it("returns 'Thunderstorm' for codes 95+", () => {
    expect(getWeatherDescription(95)).toBe("Thunderstorm");
  });

  it("returns 'Variable' for unknown codes", () => {
    expect(getWeatherDescription(999)).toBe("Variable");
  });
});

describe("calculateWateringScore", () => {
  it("returns a number between 0 and 100", () => {
    const score = calculateWateringScore(mockWeatherData);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns higher scores under heat stress", () => {
    const hotData: WeatherData = {
      ...mockWeatherData,
      hourly: {
        ...mockWeatherData.hourly,
        temperature_2m: mockWeatherData.hourly.temperature_2m.map(() => 32),
      },
    };
    const normal = calculateWateringScore(mockWeatherData);
    const hot = calculateWateringScore(hotData);
    expect(hot).toBeGreaterThanOrEqual(normal);
  });

  it("returns lower scores during precipitation", () => {
    const rainyData: WeatherData = {
      ...mockWeatherData,
      hourly: {
        ...mockWeatherData.hourly,
        precipitation: mockWeatherData.hourly.precipitation.map(() => 5),
      },
    };
    const dry = calculateWateringScore(mockWeatherData);
    const wet = calculateWateringScore(rainyData);
    expect(wet).toBeLessThanOrEqual(dry);
  });
});

describe("hasFrostRisk", () => {
  it("returns true when temps below freezing", () => {
    const frostyData: WeatherData = {
      ...mockWeatherData,
      hourly: {
        ...mockWeatherData.hourly,
        temperature_2m: mockWeatherData.hourly.temperature_2m.map(() => -2),
      },
    };
    expect(hasFrostRisk(frostyData)).toBe(true);
  });

  it("returns false when temps above freezing", () => {
    expect(hasFrostRisk(mockWeatherData)).toBe(false);
  });
});

describe("getFrostTimes", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-31T23:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns times when temperature is below freezing", () => {
    const frostyData: WeatherData = {
      ...mockWeatherData,
      hourly: {
        ...mockWeatherData.hourly,
        temperature_2m: [0, -1, -2, -3, 2, 3, 4, 5],
        time: [
          "2024-06-01T00:00",
          "2024-06-01T01:00",
          "2024-06-01T02:00",
          "2024-06-01T03:00",
          "2024-06-01T04:00",
          "2024-06-01T05:00",
          "2024-06-01T06:00",
          "2024-06-01T07:00",
        ],
      },
    };
    const times = getFrostTimes(frostyData);
    expect(times.length).toBeGreaterThan(0);
    expect(times[0]).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns empty array when no frost risk", () => {
    const times = getFrostTimes(mockWeatherData);
    expect(times).toEqual([]);
  });
});

describe("fetchWeather", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("setTimeout", mockSetTimeout);
    vi.stubGlobal("clearTimeout", mockClearTimeout);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches weather data from Open-Meteo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWeatherData),
    });

    const result = await fetchWeather(52.52, 13.41);
    expect(result.latitude).toBe(52.52);
    expect(result.longitude).toBe(13.41);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({}),
    });

    await expect(fetchWeather(0, 0)).rejects.toThrow(
      "Failed to fetch weather data",
    );
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));
    await expect(fetchWeather(0, 0)).rejects.toThrow(
      "Failed to fetch weather data",
    );
  });
});
