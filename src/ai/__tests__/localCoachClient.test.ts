import { describe, it, expect, vi, afterEach } from "vitest";

const mockPipeline = vi.fn();

vi.mock("@huggingface/transformers", () => ({
  pipeline: mockPipeline,
}));

async function resetClientState() {
  const { resetModel, onModelProgress } = await import("../localCoachClient");
  resetModel();
  onModelProgress(null);
  vi.clearAllMocks();
}

function makeGenerator(result: unknown) {
  return vi.fn().mockResolvedValue(result);
}

describe("localCoachClient", () => {
  afterEach(async () => {
    await resetClientState();
  });

  describe("isModelReady", () => {
    it("returns false before model is loaded", async () => {
      const { isModelReady } = await import("../localCoachClient");
      expect(isModelReady()).toBe(false);
    });

    it("returns true after pipeline is created", async () => {
      mockPipeline.mockResolvedValue({});
      const { getModelPipeline, isModelReady } =
        await import("../localCoachClient");
      await getModelPipeline();
      expect(isModelReady()).toBe(true);
    });

    it("returns false after resetModel", async () => {
      mockPipeline.mockResolvedValue({});
      const { getModelPipeline, isModelReady, resetModel } =
        await import("../localCoachClient");
      await getModelPipeline();
      expect(isModelReady()).toBe(true);
      resetModel();
      expect(isModelReady()).toBe(false);
    });
  });

  describe("onModelProgress", () => {
    it("receives ready status after pipeline loads", async () => {
      const callback = vi.fn();
      const { onModelProgress, getModelPipeline } =
        await import("../localCoachClient");
      onModelProgress(callback);

      mockPipeline.mockImplementation(async () => ({}));
      await getModelPipeline();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ready" }),
      );
    });

    it("receives loading status before ready", async () => {
      const callback = vi.fn();
      const { onModelProgress, getModelPipeline } =
        await import("../localCoachClient");
      onModelProgress(callback);

      mockPipeline.mockImplementation(async () => ({}));
      await getModelPipeline();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: "loading" }),
      );
    });

    it("does not fire after unregister", async () => {
      const callback = vi.fn();
      const { onModelProgress, getModelPipeline } =
        await import("../localCoachClient");

      onModelProgress(callback);
      onModelProgress(null);

      mockPipeline.mockImplementation(async () => ({}));
      await getModelPipeline();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("getModelPipeline", () => {
    it("calls pipeline with correct model id and dtype", async () => {
      mockPipeline.mockResolvedValue({});
      const { getModelPipeline } = await import("../localCoachClient");
      await getModelPipeline();

      expect(mockPipeline).toHaveBeenCalledWith(
        "text-generation",
        "onnx-community/gemma-3-1b-it-ONNX",
        expect.objectContaining({
          dtype: "q4f16",
          device: "wasm",
        }),
      );
    });

    it("returns cached instance on second call", async () => {
      mockPipeline.mockResolvedValue({});
      const { getModelPipeline } = await import("../localCoachClient");
      const first = await getModelPipeline();
      const second = await getModelPipeline();
      expect(second).toBe(first);
      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });

    it("throws and emits error on pipeline failure", async () => {
      const callback = vi.fn();
      const { onModelProgress, getModelPipeline } =
        await import("../localCoachClient");
      onModelProgress(callback);

      mockPipeline.mockRejectedValue(new Error("Model not found"));
      await expect(getModelPipeline()).rejects.toThrow("Model not found");

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: "error", error: "Model not found" }),
      );
    });
  });

  describe("generateLocalAdvice", () => {
    it("returns assistant message from array output", async () => {
      const fakeGen = makeGenerator([
        { generated_text: [{ content: "Water your tomatoes daily." }] },
      ]);
      mockPipeline.mockResolvedValue(fakeGen);

      const { getModelPipeline, resetModel, generateLocalAdvice } =
        await import("../localCoachClient");
      resetModel();
      await getModelPipeline();

      const result = await generateLocalAdvice({
        systemPrompt: "You are a garden coach.",
        message: "What should I plant?",
        context: { season: "spring" },
        history: [],
      });

      expect(result).toBe("Water your tomatoes daily.");
      expect(fakeGen).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
        expect.objectContaining({
          max_new_tokens: 700,
          temperature: 0.5,
        }),
      );
    });

    it("handles string-format generated_text", async () => {
      const fakeGen = makeGenerator([
        { generated_text: "Water your tomatoes daily." },
      ]);
      mockPipeline.mockResolvedValue(fakeGen);

      const { getModelPipeline, resetModel, generateLocalAdvice } =
        await import("../localCoachClient");
      resetModel();
      await getModelPipeline();

      const result = await generateLocalAdvice({
        systemPrompt: "",
        message: "test",
        context: {},
        history: [],
      });

      expect(result).toBe("Water your tomatoes daily.");
    });

    it("handles non-array pipeline output", async () => {
      const fakeGen = makeGenerator({
        generated_text: [{ content: "Single object output." }],
      });
      mockPipeline.mockResolvedValue(fakeGen);

      const { getModelPipeline, resetModel, generateLocalAdvice } =
        await import("../localCoachClient");
      resetModel();
      await getModelPipeline();

      const result = await generateLocalAdvice({
        systemPrompt: "",
        message: "test",
        context: {},
        history: [],
      });

      expect(result).toBe("Single object output.");
    });

    it("throws on empty response from model", async () => {
      const fakeGen = makeGenerator([{ generated_text: [] }]);
      mockPipeline.mockResolvedValue(fakeGen);

      const { getModelPipeline, resetModel, generateLocalAdvice } =
        await import("../localCoachClient");
      resetModel();
      await getModelPipeline();

      await expect(
        generateLocalAdvice({
          systemPrompt: "",
          message: "test",
          context: {},
          history: [],
        }),
      ).rejects.toThrow("Model returned an empty response.");
    });

    it("uses last 8 history entries", async () => {
      const fakeGen = makeGenerator([{ generated_text: [{ content: "OK" }] }]);
      mockPipeline.mockResolvedValue(fakeGen);

      const { getModelPipeline, resetModel, generateLocalAdvice } =
        await import("../localCoachClient");
      resetModel();
      await getModelPipeline();

      const history = Array.from({ length: 12 }, (_, i) => ({
        role: "user" as const,
        content: `msg-${i}`,
      }));

      await generateLocalAdvice({
        systemPrompt: "",
        message: "last",
        context: {},
        history,
      });

      const callArgs = fakeGen.mock.calls[0][0] as Array<{
        role: string;
      }>;
      const userMessages = callArgs.filter((m) => m.role === "user");
      expect(userMessages.length).toBeLessThanOrEqual(9);
    });
  });
});
