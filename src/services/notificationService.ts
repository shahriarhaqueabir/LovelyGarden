/**
 * Browser notification service for weather alerts and garden reminders.
 */
const NOTIFS_KEY = "notifications-enabled";

export const areNotificationsEnabled = (): boolean => {
  return localStorage.getItem(NOTIFS_KEY) === "true";
};

export const setNotificationsEnabled = (enabled: boolean): void => {
  localStorage.setItem(NOTIFS_KEY, String(enabled));
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
};

export const sendNotification = (
  title: string,
  options?: NotificationOptions,
): void => {
  if (!areNotificationsEnabled()) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      icon: "/assets/lovelygarden.png",
      ...options,
    });
  } catch {
    // Notification may fail in some environments
  }
};

/**
 * Send a notification for a weather alert if enabled and permitted.
 * Deduplicates by storing the last-seen alert in sessionStorage.
 */
const LAST_ALERT_KEY = "last-weather-alert";

export const notifyWeatherAlert = (alertText: string): void => {
  if (!areNotificationsEnabled()) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const last = sessionStorage.getItem(LAST_ALERT_KEY);
  if (last === alertText) return; // already notified
  sessionStorage.setItem(LAST_ALERT_KEY, alertText);

  const isNormal = alertText.includes("Conditions Normal");
  sendNotification(isNormal ? "🌿 Conditions Clear" : "⚠️ Garden Alert", {
    body: alertText,
    tag: "weather-alert",
  });
};
