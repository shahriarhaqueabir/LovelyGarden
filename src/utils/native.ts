import { isTauri } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { platform } from "@tauri-apps/plugin-os";

/**
 * High-level native API wrapper.
 * Provides safe access to Tauri features with graceful browser fallbacks.
 */
export const native = {
  /**
   * Returns true if the app is currently running inside a Tauri container.
   */
  isNative: isTauri(),

  /**
   * Displays a system notification.
   * Falls back to browser Notifications API or console if not in native mode.
   */
  async notify(title: string, body?: string) {
    if (this.isNative) {
      try {
        let permission = await isPermissionGranted();
        if (!permission) {
          const permissionStatus = await requestPermission();
          permission = permissionStatus === "granted";
        }

        if (permission) {
          sendNotification({ title, body });
        }
      } catch (error) {
        console.error("Native notification failed:", error);
      }
    } else {
      // Browser Fallback
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification(title, { body });
          }
        }
      } else {
        console.log(`[Notification Fallback] ${title}: ${body}`);
      }
    }
  },

  /**
   * Returns information about the underlying system.
   */
  async getSystemInfo() {
    if (!this.isNative) return { platform: "web" };
    return { platform: platform() };
  },
};
