import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
        <div style={{ flex: 1, background: "#0a0a0f" }} />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {};

export const OnShroomsRoute: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/shrooms" } },
  },
};

export const OnChatRoute: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/chat" } },
  },
};
