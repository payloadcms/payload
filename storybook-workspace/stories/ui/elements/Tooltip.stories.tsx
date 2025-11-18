import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { Tooltip } from '../../../packages/ui/src/elements/Tooltip'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    alignCaret: {
      control: 'select',
      description: 'Alignment of the tooltip caret',
      options: ['left', 'center', 'right'],
    },
    children: {
      control: 'text',
      description: 'Content to display inside the tooltip',
    },
    delay: {
      control: 'number',
      description: 'Delay in milliseconds before showing the tooltip',
    },
    position: {
      control: 'select',
      description: 'Position of the tooltip relative to its trigger',
      options: ['top', 'bottom'],
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the tooltip',
    },
  },
  component: Tooltip,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div onPointerDown={(e) => e.preventDefault()} style={{ padding: '100px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip component for displaying helpful information on hover or focus.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Tooltip',
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    alignCaret: 'center',
    children: 'This is a helpful tooltip!',
    position: 'top',
    show: true,
    staticPositioning: true,
  },
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          display: 'inline-block',
          padding: '10px',
        }}
      >
        Tooltip Target
      </div>
      <Tooltip {...args} />
    </div>
  ),
}

export const Bottom: Story = {
  args: {
    alignCaret: 'center',
    children: 'Tooltip positioned at the bottom',
    position: 'bottom',
    show: true,
    staticPositioning: true,
  },
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          display: 'inline-block',
          padding: '10px',
        }}
      >
        Tooltip Target
      </div>
      <Tooltip {...args} />
    </div>
  ),
}

export const LeftAligned: Story = {
  args: {
    alignCaret: 'left',
    children: 'Left-aligned tooltip caret',
    position: 'top',
    show: true,
    staticPositioning: true,
  },
}

export const RightAligned: Story = {
  args: {
    alignCaret: 'right',
    children: 'Right-aligned tooltip caret',
    position: 'top',
    show: true,
    staticPositioning: true,
  },
}

export const WithDelay: Story = {
  args: {
    alignCaret: 'center',
    children: 'This tooltip has a 1 second delay',
    delay: 1000,
    position: 'top',
    show: true,
    staticPositioning: true,
  },
}

export const LongContent: Story = {
  args: {
    alignCaret: 'center',
    children:
      'This is a much longer tooltip that contains more detailed information about the element it is describing. It can span multiple lines and provide comprehensive help text.',
    position: 'top',
    show: true,
    staticPositioning: true,
  },
}

// Interactive tooltip with button trigger
export const Interactive: Story = {
  render: () => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
      <div style={{ position: 'relative' }}>
        <Button
          buttonStyle="primary"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          Hover for tooltip
        </Button>

        <Tooltip alignCaret="center" position="top" show={showTooltip} staticPositioning={true}>
          This tooltip appears on hover!
        </Tooltip>
      </div>
    )
  },
}

// Multiple tooltips demonstration
export const MultipleTooltips: Story = {
  render: () => {
    const [activeTooltip, setActiveTooltip] = useState<null | string>(null)

    const tooltips = [
      { id: 'save', position: 'top' as const, text: 'Save your work' },
      { id: 'edit', position: 'bottom' as const, text: 'Edit this item' },
      { id: 'delete', position: 'top' as const, text: 'Delete permanently' },
    ]

    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {tooltips.map((tooltip) => (
          <div key={tooltip.id} style={{ position: 'relative' }}>
            <Button
              buttonStyle="secondary"
              onMouseEnter={() => setActiveTooltip(tooltip.id)}
              onMouseLeave={() => setActiveTooltip(null)}
              size="small"
            >
              {tooltip.id.charAt(0).toUpperCase() + tooltip.id.slice(1)}
            </Button>

            <Tooltip
              alignCaret="center"
              position={tooltip.position}
              show={activeTooltip === tooltip.id}
              staticPositioning={true}
            >
              {tooltip.text}
            </Tooltip>
          </div>
        ))}
      </div>
    )
  },
}

// Different caret alignments showcase
export const CaretAlignments: Story = {
  render: () => {
    const alignments: Array<'center' | 'left' | 'right'> = ['left', 'center', 'right']

    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '40px',
          justifyContent: 'center',
        }}
      >
        {alignments.map((alignment) => (
          <div key={alignment} style={{ position: 'relative' }}>
            <div
              style={{
                alignItems: 'center',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                display: 'flex',
                height: '40px',
                justifyContent: 'center',
                width: '80px',
              }}
            >
              {alignment}
            </div>

            <Tooltip alignCaret={alignment} position="top" show={true} staticPositioning={true}>
              Caret aligned {alignment}
            </Tooltip>
          </div>
        ))}
      </div>
    )
  },
}

export const PositionComparison: Story = {
  render: () => {
    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '60px',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              alignItems: 'center',
              backgroundColor: '#007acc',
              borderRadius: '4px',
              color: 'white',
              display: 'flex',
              height: '40px',
              justifyContent: 'center',
              width: '100px',
            }}
          >
            Top Tooltip
          </div>

          <Tooltip alignCaret="center" position="top" show={true} staticPositioning={true}>
            Positioned above
          </Tooltip>
        </div>

        <div style={{ position: 'relative' }}>
          <div
            style={{
              alignItems: 'center',
              backgroundColor: '#28a745',
              borderRadius: '4px',
              color: 'white',
              display: 'flex',
              height: '40px',
              justifyContent: 'center',
              width: '100px',
            }}
          >
            Bottom Tooltip
          </div>

          <Tooltip alignCaret="center" position="bottom" show={true} staticPositioning={true}>
            Positioned below
          </Tooltip>
        </div>
      </div>
    )
  },
}
