import {
  pipeline,
  type TextGenerationPipeline,
} from "@huggingface/transformers";

const MODEL_ID = "onnx-community/gemma-3-1b-it-ONNX";
const MODEL_DTYPE = "q4f16";

export interface ModelProgress {
  /** Status label: "download" | "loading" | "ready" | "error" */
  status: "download" | "loading" | "ready" | "error";
  /** Percentage 0-100, only during "download" */
  percent: number;
  /** Human-readable file name currently downloading */
  file: string;
  /** Error message if status is "error" */
  error?: string;
}

type ProgressCallback = (progress: ModelProgress) => void;

let generatorPromise: Promise<TextGenerationPipeline> | null = null;
let generatorInstance: TextGenerationPipeline | null = null;
let progressCallback: ProgressCallback | null = null;

function makeProgress(
  status: ModelProgress["status"],
  percent = 0,
  file = "",
  error?: string,
): ModelProgress {
  return { status, percent, file, error };
}

function defaultProgressHandler(p: ModelProgress): void {
  // In a non-UI context, just log
  if (p.status === "error") console.error("Model load failed:", p.error);
}

/**
 * Register a callback to receive model loading/download progress updates.
 * Call with `null` to unregister.
 */
export function onModelProgress(cb: ProgressCallback | null): void {
  progressCallback = cb;
}

function emitProgress(p: ModelProgress): void {
  (progressCallback ?? defaultProgressHandler)(p);
}

/**
 * Get the singleton model pipeline, initializing it on first call.
 * Subsequent calls return the already-loaded instance.
 */
export async function getModelPipeline(): Promise<TextGenerationPipeline> {
  if (generatorInstance) return generatorInstance;
  if (generatorPromise) return generatorPromise;

  generatorPromise = (async () => {
    try {
      emitProgress(makeProgress("download", 0, "model.onnx"));

      emitProgress(makeProgress("loading", 0, ""));

      const gen = await pipeline("text-generation", MODEL_ID, {
        dtype: MODEL_DTYPE,
        device: "wasm",
        progress_callback: (progress) => {
          if (!progress || typeof progress !== "object") return;
          const pct = Math.round(
            (((progress as { loaded?: number; total?: number }).loaded ?? 0) /
              Math.max(
                (progress as { loaded?: number; total?: number }).total ?? 1,
                1,
              )) *
              100,
          );
          const file = (progress as { file?: string }).file ?? "model.onnx";
          emitProgress(makeProgress("download", Math.min(pct, 99), file));
        },
      });

      generatorInstance = gen as unknown as TextGenerationPipeline;
      emitProgress(makeProgress("ready", 100, ""));
      return generatorInstance;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load model.";
      emitProgress(makeProgress("error", 0, "", message));
      generatorPromise = null;
      throw err;
    }
  })();

  return generatorPromise;
}

/**
 * Check whether the model has already been loaded and cached.
 */
export function isModelReady(): boolean {
  return generatorInstance !== null;
}

/**
 * Reset the loaded model (e.g. on unrecoverable error, to retry).
 */
export function resetModel(): void {
  generatorInstance = null;
  generatorPromise = null;
}

interface GenerateLocalAdviceOptions {
  systemPrompt: string;
  message: string;
  context: unknown;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Generate garden advice using the local in-browser model.
 *
 * Follows the same calling convention as the old Gemini client,
 * but runs entirely on-device.
 */
export async function generateLocalAdvice({
  systemPrompt,
  message,
  context,
  history,
}: GenerateLocalAdviceOptions): Promise<string> {
  const gen = await getModelPipeline();

  const conversation = history.slice(-8).map((entry) => ({
    role:
      entry.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: entry.content,
  }));

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: systemPrompt },
    ...conversation,
    {
      role: "user",
      content: `App context:\n${JSON.stringify(context, null, 2)}\n\nUser question:\n${message}`,
    },
  ];

  const output = await gen(messages, {
    max_new_tokens: 700,
    do_sample: true,
    temperature: 0.5,
  });

  const result = Array.isArray(output) ? output[0] : output;
  const generated = (
    result as { generated_text: string | Array<{ content: string }> }
  )?.generated_text;

  let text = "";
  if (typeof generated === "string") {
    text = generated;
  } else if (Array.isArray(generated) && generated.length > 0) {
    text = generated[generated.length - 1]?.content ?? "";
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Model returned an empty response.");
  }
  return trimmed;
}
