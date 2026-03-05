import type { Meta, StoryObj } from "@storybook/react";
import { VisualOfficeCanvas } from "./VisualOfficeCanvas";

const meta: Meta<typeof VisualOfficeCanvas> = {
  component: VisualOfficeCanvas,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof VisualOfficeCanvas>;

export const Default: Story = {
  render: () => (
    <div className="h-screen w-screen bg-slate-900">
      <VisualOfficeCanvas />
    </div>
  ),
};
