import type { Meta, StoryObj } from "@storybook/react-vite";
import Modal from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    isOpen: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: "Example Modal",
    children: <p className="text-stone-300">This is the modal content.</p>,
    onClose: () => alert("closed"),
  },
};

export const WithCustomContent: Story = {
  args: {
    isOpen: true,
    title: "Plant Details",
    children: (
      <div className="space-y-2">
        <p className="text-stone-300">Tomato (Solanum lycopersicum)</p>
        <p className="text-sm text-stone-500">A red fruit vegetable</p>
      </div>
    ),
    onClose: () => alert("closed"),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: "Hidden Modal",
    children: <p>This won't be visible.</p>,
    onClose: () => {},
  },
};
