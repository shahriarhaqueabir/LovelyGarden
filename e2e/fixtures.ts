import { test as base, expect } from "@playwright/test";

function buildMockWeather() {
  const now = new Date();
  const hourlyCount = 48;
  const dailyCount = 7;

  const hourlyTime = Array.from({ length: hourlyCount }, (_, i) =>
    new Date(now.getTime() + i * 60 * 60 * 1000).toISOString(),
  );
  const dailyTime = Array.from({ length: dailyCount }, (_, i) =>
    new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
  );

  return {
    latitude: 51.0504,
    longitude: 13.7373,
    timezone: "Europe/Berlin",
    current: {
      temperature_2m: 18,
      relative_humidity_2m: 54,
      precipitation: 0,
      weather_code: 1,
      wind_speed_10m: 8,
    },
    hourly: {
      time: hourlyTime,
      temperature_2m: Array.from(
        { length: hourlyCount },
        (_, i) => 16 + (i % 8),
      ),
      relative_humidity_2m: Array.from({ length: hourlyCount }, () => 55),
      precipitation: Array.from({ length: hourlyCount }, () => 0),
      et0_fao_evapotranspiration: Array.from(
        { length: hourlyCount },
        () => 0.2,
      ),
      dew_point_2m: Array.from({ length: hourlyCount }, () => 10),
      wind_speed_10m: Array.from({ length: hourlyCount }, () => 8),
    },
    daily: {
      time: dailyTime,
      temperature_2m_max: Array.from({ length: dailyCount }, () => 22),
      temperature_2m_min: Array.from({ length: dailyCount }, () => 11),
      precipitation_sum: Array.from({ length: dailyCount }, () => 0),
    },
  };
}

/** Sign in via the auth form with the given credentials. */
export async function signInAsTestUser(
  page: import("@playwright/test").Page,
  email?: string,
  password?: string,
) {
  const rnd = Date.now();
  const testEmail = email ?? `playwright+${rnd}@example.com`;
  const testPassword = password ?? "Test1234!";

  // Check if already authenticated (app shell visible)
  const appShell = page.locator(".app-shell");
  if (await appShell.isVisible().catch(() => false)) return;

  await page.waitForSelector('[data-testid="auth-email"]', { timeout: 30_000 });
  await page.fill('[data-testid="auth-email"]', testEmail);
  await page.fill('[data-testid="auth-password"]', testPassword);
  await page.click('[data-testid="auth-submit"]');

  // Wait for auth to resolve — either app shell appears or we stay on the form.
  // Allow failures so caller can decide how to handle.
  await appShell.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {});
}

export const test = base.extend<{ _debugLogs: void }>({
  _debugLogs: [
    async ({ page }, use, testInfo) => {
      const logs: string[] = [];
      const push = (line: string) => {
        if (logs.length < 1200) {
          logs.push(`[${new Date().toISOString()}] ${line}`);
        }
      };

      const weatherPayload = buildMockWeather();

      await page.route("https://api.open-meteo.com/**", async (route) => {
        push(
          `[route:mock] ${route.request().method()} ${route.request().url()}`,
        );
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(weatherPayload),
        });
      });

      page.on("console", (msg) => {
        push(`[console:${msg.type()}] ${msg.text()}`);
      });
      page.on("pageerror", (error) => {
        push(`[pageerror] ${error.stack || error.message}`);
      });
      page.on("requestfailed", (request) => {
        const failureText = request.failure()?.errorText || "unknown_error";
        push(
          `[requestfailed] ${request.method()} ${request.url()} :: ${failureText}`,
        );
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          push(
            `[response:${response.status()}] ${response.request().method()} ${response.url()}`,
          );
        }
      });

      await use();

      const body =
        logs.length > 0
          ? logs.join("\n")
          : "No browser/network diagnostics captured.";
      await testInfo.attach("browser-diagnostics.log", {
        body,
        contentType: "text/plain",
      });

      if (testInfo.status !== testInfo.expectedStatus) {
        try {
          await testInfo.attach("dom-snapshot.html", {
            body: await page.content(),
            contentType: "text/html",
          });
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          await testInfo.attach("dom-snapshot-error.txt", {
            body: reason,
            contentType: "text/plain",
          });
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
