import type { Meta, StoryObj } from "@storybook/react-vite";
import ErrorBoundary from "./ErrorBoundary";

const ThrowError = () => {
  throw new Error("This is a test error!");
};

const meta: Meta<typeof ErrorBoundary> = {
  title: "UI/ErrorBoundary",
  component: ErrorBoundary,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 text-stone-200">This content renders fine.</div>
    ),
  },
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  ),
};

export const CustomFallback: Story = {
  args: {
    children: <div>Content</div>,
    fallback: ({ error, resetErrorBoundary }) => (
      <div className="p-4 bg-red-900/20 rounded-lg">
        <p className="text-red-400">Custom error: {error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="mt-2 px-3 py-1 bg-red-500 rounded"
        >
          Reset
        </button>
      </div>
    ),
  },
};
