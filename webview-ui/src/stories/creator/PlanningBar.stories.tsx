import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PlanningBar } from '../../creatorOverlay/ui/planningBar';

const meta: Meta<typeof PlanningBar> = {
  title: 'Components/PlanningBar',
  component: PlanningBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-4 border border-gray-200 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanningBar>;

// Basic story
export const Default: Story = {
  render: () => <PlanningBar />
};

// You can later add more stories as your component evolves
export const isGenerating: Story = {
  render: () => <PlanningBar isGenerating/* Add props here as you develop them */ />
};