import { GARDEN_COACH_INSTRUCTIONS } from "./gardenCoachInstructions";

interface GenerateGardenAdviceOptions {
  apiKey: string;
  model: string;
  message: string;
  context: unknown;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export const generateGardenAdvice = async ({
  apiKey,
  model,
  message,
  context,
  history,
}: GenerateGardenAdviceOptions): Promise<string> => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("Add your Gemini API key to enable Garden Coach.");
  }

  const conversation = history.slice(-8).map((entry) => ({
    role: entry.role === "assistant" ? "model" : "user",
    parts: [{ text: entry.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: GARDEN_COACH_INSTRUCTIONS }],
        },
        contents: [
          ...conversation,
          {
            role: "user",
            parts: [
              {
                text: `App context:\n${JSON.stringify(
                  context,
                  null,
                  2,
                )}\n\nUser question:\n${message}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 700,
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini request failed.");
  }

  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() ?? "";

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
};
