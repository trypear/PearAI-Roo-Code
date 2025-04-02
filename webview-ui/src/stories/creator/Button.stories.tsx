import { Button } from "../../creatorOverlay/ui/button";
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Loader2, FileText } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "plan"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    toggled: {
      control: "boolean",
    },
    asChild: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "lg",
  },
};

export const Icon: Story = {
  args: {
    children: <Mail />,
    size: "icon",
    "aria-label": "Email",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail />
        Login with Email
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    children: (
      <>
        <Loader2 className="animate-spin" />
        Please wait
      </>
    ),
    disabled: true,
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="https://example.com">Link as Button</a>,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const MakePlan: Story = {
  args: {
    children: (
      <>
        <FileText className="text-[#4388F8]" />
        Make a plan
      </>
    ),
    variant: "secondary",
    size: "sm",
    className: "rounded-full",
  },
};

export const ToggledButton: Story = {
  args: {
    children: "Toggled Button",
    toggled: true,
  },
};

export const ToggledMakePlan: Story = {
  args: {
    children: (
      <>
        <FileText className="text-[#4388F8]" />
        Make a plan
      </>
    ),
    variant: "secondary",
    size: "sm",
    className: "rounded-full",
    toggled: true,
  },
};

// Example with the onToggle functionality
export const ToggleableButton: Story = {
  render: () => {
    const [toggled, setToggled] = React.useState(false);
    return (
      <Button 
        onToggle={(newToggled) => setToggled(newToggled)} 
        toggled={toggled}
      >
        Toggle me: {toggled ? "On" : "Off"}
      </Button>
    );
  },
};

export const MakePlanButton = () => {
    const [toggled, setToggled] = React.useState(false);
    
    return (
      <Button 
        variant="secondary" 
        size="sm" 
        className="rounded-full" 
        toggled={toggled}
        onToggle={(newToggled) => setToggled(newToggled)}
      >
        <FileText className="text-[#4388F8]" />
        Make a plan
      </Button>
    );
  };

// Standalone story for the MakePlanButton component
export const MakePlanComponent: StoryObj<typeof MakePlanButton> = {
  render: () => <MakePlanButton />,
};