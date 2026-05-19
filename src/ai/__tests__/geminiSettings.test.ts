import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getStoredGeminiApiKey,
  hasConnectedGemini,
  markGeminiConnected,
  storeGeminiApiKey,
} from "../geminiSettings";

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};

describe("geminiSettings", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the Gemini API key in session storage only", () => {
    storeGeminiApiKey(" test-key ");
    markGeminiConnected();

    expect(getStoredGeminiApiKey()).toBe("test-key");
    expect(hasConnectedGemini()).toBe(true);
    expect(localStorage.getItem("lovelygarden.geminiApiKey")).toBeNull();
    expect(sessionStorage.getItem("lovelygarden.geminiApiKey")).toBe(
      "test-key",
    );
  });

  it("removes legacy persisted API keys from local storage", () => {
    localStorage.setItem("lovelygarden.geminiApiKey", "old-key");
    localStorage.setItem("lovelygarden.geminiConnectedAt", "1");

    expect(getStoredGeminiApiKey()).toBe("");
    expect(localStorage.getItem("lovelygarden.geminiApiKey")).toBeNull();
    expect(localStorage.getItem("lovelygarden.geminiConnectedAt")).toBeNull();
  });
});
