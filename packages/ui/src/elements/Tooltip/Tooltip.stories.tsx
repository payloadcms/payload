/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../Button/index.js'
import { Tooltip } from './index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Tooltip> = {
  args: {
    children: 'This is a tooltip',
  },
  argTypes: {
    alignCaret: {
      control: 'select',
      description: 'Position of the caret relative to the tooltip',
      options: ['center', 'left', 'right'],
    },
    boundingRef: {
      control: false,
      description: 'Reference to element that bounds the tooltip positioning',
    },
    children: {
      control: 'text',
      description: 'Content to display in the tooltip',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    delay: {
      control: { type: 'number', max: 2000, min: 0, step: 100 },
      description: 'Delay in milliseconds before showing the tooltip',
    },
    position: {
      control: 'select',
      description: 'Position of the tooltip relative to the trigger',
      options: ['bottom', 'top'],
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the tooltip',
    },
    staticPositioning: {
      control: 'boolean',
      description: 'Whether to use static positioning instead of dynamic',
    },
  },
  component: Tooltip,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A tooltip component that displays helpful information on hover.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Tooltip',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hover for tooltip</Button>
      </Tooltip>
    </div>
  ),
}

export const WithText: Story = {
  args: {
    children: 'This is a helpful tooltip with more detailed information',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hover for detailed tooltip</Button>
      </Tooltip>
    </div>
  ),
}

export const TopPosition: Story = {
  args: {
    children: 'Tooltip on top',
    position: 'top',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hover for top tooltip</Button>
      </Tooltip>
    </div>
  ),
}

export const BottomPosition: Story = {
  args: {
    children: 'Tooltip on bottom',
    position: 'bottom',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hover for bottom tooltip</Button>
      </Tooltip>
    </div>
  ),
}

// Caret alignment
export const CaretCenter: Story = {
  args: {
    alignCaret: 'center',
    children: 'Center aligned caret',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Center caret</Button>
      </Tooltip>
    </div>
  ),
}

export const CaretLeft: Story = {
  args: {
    alignCaret: 'left',
    children: 'Left aligned caret',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Left caret</Button>
      </Tooltip>
    </div>
  ),
}

export const CaretRight: Story = {
  args: {
    alignCaret: 'right',
    children: 'Right aligned caret',
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Right caret</Button>
      </Tooltip>
    </div>
  ),
}

// Timing
export const WithDelay: Story = {
  args: {
    children: 'Tooltip with delay',
    delay: 1000,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hover and wait</Button>
      </Tooltip>
    </div>
  ),
}

export const NoDelay: Story = {
  args: {
    children: 'Instant tooltip',
    delay: 0,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Instant tooltip</Button>
      </Tooltip>
    </div>
  ),
}

// States
export const AlwaysVisible: Story = {
  args: {
    children: 'Always visible tooltip',
    show: true,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Always visible</Button>
      </Tooltip>
    </div>
  ),
}

export const Hidden: Story = {
  args: {
    children: 'Hidden tooltip',
    show: false,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Hidden tooltip</Button>
      </Tooltip>
    </div>
  ),
}

// Static positioning
export const StaticPositioning: Story = {
  args: {
    children: 'Static positioned tooltip',
    staticPositioning: true,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Static positioning</Button>
      </Tooltip>
    </div>
  ),
}

// Complex content
export const WithRichContent: Story = {
  args: {
    children: (
      <div>
        <strong>Rich Content</strong>
        <br />
        This tooltip contains <em>formatted</em> text and multiple lines.
      </div>
    ),
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Tooltip {...args}>
        <Button>Rich content tooltip</Button>
      </Tooltip>
    </div>
  ),
}

// Multiple tooltips
export const MultipleTooltips: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of multiple tooltips with different configurations.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <Tooltip children="Basic tooltip">
        <Button>Basic</Button>
      </Tooltip>

      <Tooltip alignCaret="left" children="Left caret">
        <Button>Left Caret</Button>
      </Tooltip>

      <Tooltip alignCaret="right" children="Right caret">
        <Button>Right Caret</Button>
      </Tooltip>

      <Tooltip children="Top position" position="top">
        <Button>Top</Button>
      </Tooltip>

      <Tooltip children="Bottom position" position="bottom">
        <Button>Bottom</Button>
      </Tooltip>

      <Tooltip children="With delay" delay={500}>
        <Button>Delayed</Button>
      </Tooltip>

      <Tooltip children="Always visible" show={true}>
        <Button>Always On</Button>
      </Tooltip>
    </div>
  ),
}
