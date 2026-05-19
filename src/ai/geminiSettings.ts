const GEMINI_API_KEY_STORAGE_KEY = "lovelygarden.geminiApiKey";
const GEMINI_MODEL_STORAGE_KEY = "lovelygarden.geminiModel";
const GEMINI_CONNECTED_AT_STORAGE_KEY = "lovelygarden.geminiConnectedAt";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const getSessionValue = (key: string): string | null => {
  try {
    return typeof sessionStorage === "undefined"
      ? null
      : sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionValue = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the app can still run in restricted browsers.
  }
};

const removeSessionValue = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures so the app can still run in restricted browsers.
  }
};

const getLocalValue = (key: string): string | null => {
  try {
    return typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setLocalValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the app can still run in restricted browsers.
  }
};

const removeLocalValue = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so the app can still run in restricted browsers.
  }
};

const removeLegacyPersistedApiKey = () => {
  removeLocalValue(GEMINI_API_KEY_STORAGE_KEY);
  removeLocalValue(GEMINI_CONNECTED_AT_STORAGE_KEY);
};

export const getStoredGeminiApiKey = (): string => {
  removeLegacyPersistedApiKey();
  return getSessionValue(GEMINI_API_KEY_STORAGE_KEY) ?? "";
};

export const storeGeminiApiKey = (apiKey: string) => {
  removeLegacyPersistedApiKey();
  setSessionValue(GEMINI_API_KEY_STORAGE_KEY, apiKey.trim());
};

export const removeStoredGeminiApiKey = () => {
  removeLegacyPersistedApiKey();
  removeSessionValue(GEMINI_API_KEY_STORAGE_KEY);
  removeSessionValue(GEMINI_CONNECTED_AT_STORAGE_KEY);
};

export const getStoredGeminiModel = (): string => {
  return getLocalValue(GEMINI_MODEL_STORAGE_KEY) ?? DEFAULT_GEMINI_MODEL;
};

export const storeGeminiModel = (model: string) => {
  setLocalValue(GEMINI_MODEL_STORAGE_KEY, model.trim());
};

export const markGeminiConnected = () => {
  removeLegacyPersistedApiKey();
  setSessionValue(GEMINI_CONNECTED_AT_STORAGE_KEY, Date.now().toString());
};

export const clearGeminiConnection = () => {
  removeLegacyPersistedApiKey();
  removeSessionValue(GEMINI_CONNECTED_AT_STORAGE_KEY);
};

export const hasConnectedGemini = (): boolean => {
  removeLegacyPersistedApiKey();
  return (
    Boolean(getSessionValue(GEMINI_CONNECTED_AT_STORAGE_KEY)) &&
    Boolean(getSessionValue(GEMINI_API_KEY_STORAGE_KEY)?.trim())
  );
};
