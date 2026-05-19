const GEMINI_API_KEY_STORAGE_KEY = "lovelygarden.geminiApiKey";
const GEMINI_MODEL_STORAGE_KEY = "lovelygarden.geminiModel";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const getStoredGeminiApiKey = (): string => {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ?? "";
};

export const storeGeminiApiKey = (apiKey: string) => {
  localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey.trim());
};

export const removeStoredGeminiApiKey = () => {
  localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};

export const getStoredGeminiModel = (): string => {
  if (typeof localStorage === "undefined") return DEFAULT_GEMINI_MODEL;
  return localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) ?? DEFAULT_GEMINI_MODEL;
};

export const storeGeminiModel = (model: string) => {
  localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model.trim());
};
