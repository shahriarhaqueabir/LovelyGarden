import React from "react";
import { CloudOff, Download, Loader2, Send, Sparkles, X } from "lucide-react";
import type { PlantSpecies } from "../schema/knowledge-graph";
import type { WeatherData } from "../services/weatherService";
import {
  GARDEN_COACH_INSTRUCTIONS,
  GARDEN_COACH_QUICK_PROMPTS,
} from "../ai/gardenCoachInstructions";
import { buildGardenCoachContext } from "../ai/buildGardenContext";
import {
  generateLocalAdvice,
  getModelPipeline,
  isModelReady,
  onModelProgress,
  resetModel,
  type ModelProgress,
} from "../ai/localCoachClient";

interface GardenCoachSheetProps {
  catalog: PlantSpecies[];
  currentDay: number;
  hemisphere: "North" | "South";
  weather: WeatherData | null;
  onClose: () => void;
  onConnectionLost?: () => void;
}

interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const createMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;

type ModelState =
  | { status: "prompt" } // waiting for user to start
  | { status: "downloading"; percent: number; file: string }
  | { status: "loading" } // model loaded into memory, warming up
  | { status: "ready" }
  | { status: "error"; message: string };

export const GardenCoachSheet: React.FC<GardenCoachSheetProps> = ({
  catalog,
  currentDay,
  hemisphere,
  weather,
  onClose,
  onConnectionLost,
}) => {
  const [modelState, setModelState] = React.useState<ModelState>(
    isModelReady() ? { status: "ready" } : { status: "prompt" },
  );
  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  // Listen for model download progress
  React.useEffect(() => {
    onModelProgress((p: ModelProgress) => {
      if (p.status === "download") {
        setModelState({
          status: "downloading",
          percent: p.percent,
          file: p.file,
        });
      } else if (p.status === "loading") {
        setModelState({ status: "loading" });
      } else if (p.status === "ready") {
        setModelState({ status: "ready" });
      } else if (p.status === "error") {
        setModelState({ status: "error", message: p.error ?? "Unknown error" });
      }
    });
    return () => onModelProgress(null);
  }, []);

  const handleDownloadModel = async () => {
    setModelState({ status: "downloading", percent: 0, file: "model.onnx" });
    try {
      await getModelPipeline();
      // The progress callback updates the state above
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to download model.";
      setModelState({ status: "error", message });
    }
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    if (!isModelReady()) {
      setError("Model not loaded. Please download it first.");
      return;
    }

    setError(null);
    setInput("");
    const userMessage: CoachMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };
    setMessages((current) => [...current, userMessage]);
    setIsSending(true);

    try {
      const context = await buildGardenCoachContext({
        catalog,
        currentDay,
        hemisphere,
        weather,
      });
      const answer = await generateLocalAdvice({
        systemPrompt: GARDEN_COACH_INSTRUCTIONS,
        message,
        context,
        history: messages,
      });
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (caughtError) {
      onConnectionLost?.();
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Garden Coach could not answer right now.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="garden-coach-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close Garden Coach"
        onClick={onClose}
      />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] min-h-[70dvh] flex-col overflow-hidden rounded-t-2xl border border-stone-800 bg-stone-950 shadow-2xl lg:inset-y-4 lg:left-auto lg:right-4 lg:w-[420px] lg:max-h-none lg:rounded-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950/70 text-garden-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="garden-coach-title"
                className="truncate text-sm font-black uppercase tracking-wide text-garden-300"
              >
                Garden Coach
              </h2>
              <p className="truncate text-[11px] font-bold text-stone-500">
                On-device, private, offline-ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 hover:border-red-500/40 hover:text-red-300"
            aria-label="Close Garden Coach"
            title="Close Garden Coach"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {modelState.status === "prompt" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950/50">
              <Sparkles className="h-8 w-8 text-garden-400" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-black uppercase tracking-wider text-garden-300">
                Local AI Coach
              </h3>
              <p className="text-sm leading-6 text-stone-400">
                Download the garden coach model to your device. Runs entirely
                offline — no account, no API key, no data leaves your browser.
                ~760 MB download.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadModel}
              className="inline-flex h-12 items-center gap-3 rounded-xl btn-primary px-6 text-sm font-black uppercase tracking-widest"
            >
              <Download className="h-5 w-5" />
              Download Model
            </button>
            <p className="text-xs leading-5 text-stone-600">
              First-time download only (~760 MB). Cached for offline use.
              Recommended on WiFi to avoid data charges.
            </p>
          </div>
        ) : modelState.status === "downloading" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-garden-400" />
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-stone-400">
                <span className="truncate">{modelState.file}</span>
                <span>{modelState.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-800">
                <div
                  className="h-full rounded-full bg-garden-500 transition-all duration-300"
                  style={{ width: `${modelState.percent}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Downloading model to your device…
            </p>
          </div>
        ) : modelState.status === "loading" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-garden-400" />
            <p className="text-xs font-bold text-stone-400">
              Loading model into memory…
            </p>
          </div>
        ) : modelState.status === "error" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <CloudOff className="h-10 w-10 text-red-400" />
            <div>
              <p className="mb-1 text-sm font-bold text-red-300">
                Download failed
              </p>
              <p className="text-xs leading-5 text-stone-400">
                {modelState.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetModel();
                setModelState({ status: "prompt" });
              }}
              className="inline-flex h-10 items-center rounded-lg btn-primary px-4 text-xs font-black uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex min-h-full flex-col justify-end gap-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-300">
                      Ask about planting, spacing, care, pests, harvest timing,
                      or what your current garden needs next.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {GARDEN_COACH_QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={isSending}
                        onClick={() => void sendMessage(prompt)}
                        className="min-h-11 rounded-lg border border-stone-800 bg-stone-900 px-3 text-left text-xs font-bold text-stone-300 hover:border-garden-500/40 hover:text-garden-200 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                        message.role === "user"
                          ? "ml-8 bg-garden-500 text-stone-950"
                          : "mr-8 border border-stone-800 bg-stone-900 text-stone-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                  {isSending && (
                    <div className="mr-8 inline-flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-bold text-stone-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            {error && (
              <div className="mx-4 mb-3 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200">
                {error}
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="border-t border-stone-800 bg-stone-950 px-4 py-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Garden Coach..."
                  rows={1}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-stone-800 bg-stone-900 px-3 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-garden-500"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg btn-primary disabled:opacity-50"
                  aria-label="Send message"
                  title="Send message"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
};
