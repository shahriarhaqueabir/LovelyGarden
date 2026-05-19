import { afterEach, describe, expect, it, vi } from "vitest";
import { generateGardenAdvice } from "../geminiClient";

describe("generateGardenAdvice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Gemini key in a header instead of the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Water deeply." }] } }],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await generateGardenAdvice({
      apiKey: " test-key ",
      model: "gemini-2.5-flash",
      message: "What should I do today?",
      context: { season: "spring" },
      history: [],
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(url).not.toContain("key=");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-goog-api-key": "test-key",
    });
  });
});
