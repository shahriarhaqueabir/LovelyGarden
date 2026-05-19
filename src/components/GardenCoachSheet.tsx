import React from "react";
import {
  KeyRound,
  Loader2,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { PlantSpecies } from "../schema/knowledge-graph";
import type { WeatherData } from "../services/weatherService";
import {
  DEFAULT_GEMINI_MODEL,
  clearGeminiConnection,
  getStoredGeminiApiKey,
  getStoredGeminiModel,
  markGeminiConnected,
  removeStoredGeminiApiKey,
  storeGeminiApiKey,
  storeGeminiModel,
} from "../ai/geminiSettings";
import { GARDEN_COACH_QUICK_PROMPTS } from "../ai/gardenCoachInstructions";
import { generateGardenAdvice } from "../ai/geminiClient";
import { buildGardenCoachContext } from "../ai/buildGardenContext";

interface GardenCoachSheetProps {
  catalog: PlantSpecies[];
  currentDay: number;
  hemisphere: "North" | "South";
  weather: WeatherData | null;
  locationName: string | null;
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
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const GardenCoachSheet: React.FC<GardenCoachSheetProps> = ({
  catalog,
  currentDay,
  hemisphere,
  weather,
  locationName,
  onClose,
  onConnectionLost,
}) => {
  const [apiKey, setApiKey] = React.useState(getStoredGeminiApiKey);
  const [draftKey, setDraftKey] = React.useState(apiKey);
  const [model, setModel] = React.useState(getStoredGeminiModel);
  const [messages, setMessages] = React.useState<CoachMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(!apiKey);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const hasApiKey = apiKey.trim().length > 0;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  const handleSaveSettings = () => {
    const trimmedKey = draftKey.trim();
    const trimmedModel = model.trim() || DEFAULT_GEMINI_MODEL;
    if (trimmedKey) {
      storeGeminiApiKey(trimmedKey);
      setApiKey(trimmedKey);
    }
    storeGeminiModel(trimmedModel);
    setModel(trimmedModel);
    setShowSettings(false);
    setError(null);
  };

  const handleRemoveKey = () => {
    removeStoredGeminiApiKey();
    setApiKey("");
    setDraftKey("");
    setShowSettings(true);
    onConnectionLost?.();
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || isSending) return;

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
        locationName,
      });
      const answer = await generateGardenAdvice({
        apiKey,
        model,
        message,
        context,
        history: messages,
      });
      markGeminiConnected();
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (caughtError) {
      clearGeminiConnection();
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
                Gemini, optional and local-key
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 hover:border-garden-500/40 hover:text-garden-300"
              aria-label="Garden Coach settings"
              title="Garden Coach settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 hover:border-red-500/40 hover:text-red-300"
              aria-label="Close Garden Coach"
              title="Close Garden Coach"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {showSettings ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
              <div className="mb-4 flex items-center gap-2 text-garden-300">
                <KeyRound className="h-4 w-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Gemini Setup
                </h3>
              </div>
              <label className="mb-3 block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-stone-500">
                  API Key
                </span>
                <input
                  type="password"
                  value={draftKey}
                  onChange={(event) => setDraftKey(event.target.value)}
                  placeholder="AIza..."
                  className="h-11 w-full rounded-lg border border-stone-800 bg-stone-950 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                />
              </label>
              <label className="mb-4 block">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-stone-500">
                  Model
                </span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={DEFAULT_GEMINI_MODEL}
                  className="h-11 w-full rounded-lg border border-stone-800 bg-stone-950 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-garden-500 px-4 text-xs font-black uppercase tracking-widest text-stone-950 hover:bg-garden-400"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-800 bg-stone-950 text-stone-400 hover:border-red-500/40 hover:text-red-300"
                  aria-label="Remove Gemini key"
                  title="Remove Gemini key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs leading-5 text-stone-500">
              The key is stored only in this browser. Garden Coach reads your
              local LovelyGarden data to answer, but it does not edit gardens,
              inventory, settings, or logbook entries.
            </p>
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
                        disabled={!hasApiKey || isSending}
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
              {!hasApiKey ? (
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="h-11 w-full rounded-lg bg-garden-500 px-4 text-xs font-black uppercase tracking-widest text-stone-950 hover:bg-garden-400"
                >
                  Add Gemini Key
                </button>
              ) : (
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
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-garden-500 text-stone-950 hover:bg-garden-400 disabled:opacity-50"
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
              )}
            </form>
          </>
        )}
      </section>
    </div>
  );
};
