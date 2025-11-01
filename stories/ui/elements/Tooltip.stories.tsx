import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { Tooltip } from '../../../packages/ui/src/elements/Tooltip'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tooltip component for displaying helpful information on hover or focus.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ padding: '100px' }} onPointerDown={(e) => e.preventDefault()}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display inside the tooltip',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom'],
      description: 'Position of the tooltip relative to its trigger',
    },
    alignCaret: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Alignment of the tooltip caret',
    },
    delay: {
      control: 'number',
      description: 'Delay in milliseconds before showing the tooltip',
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the tooltip',
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        Tooltip Target
      </div>
      <Tooltip {...args} />
    </div>
  ),
  args: {
    children: 'This is a helpful tooltip!',
    show: true,
    position: 'top',
    alignCaret: 'center',
    staticPositioning: true,
  },
}

export const Bottom: Story = {
  render: (args) => (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        Tooltip Target
      </div>
      <Tooltip {...args} />
    </div>
  ),
  args: {
    children: 'Tooltip positioned at the bottom',
    show: true,
    position: 'bottom',
    alignCaret: 'center',
    staticPositioning: true,
  },
}

export const LeftAligned: Story = {
  args: {
    children: 'Left-aligned tooltip caret',
    show: true,
    position: 'top',
    alignCaret: 'left',
    staticPositioning: true,
  },
}

export const RightAligned: Story = {
  args: {
    children: 'Right-aligned tooltip caret',
    show: true,
    position: 'top',
    alignCaret: 'right',
    staticPositioning: true,
  },
}

export const WithDelay: Story = {
  args: {
    children: 'This tooltip has a 1 second delay',
    show: true,
    delay: 1000,
    position: 'top',
    alignCaret: 'center',
    staticPositioning: true,
  },
}

export const LongContent: Story = {
  args: {
    children: 'This is a much longer tooltip that contains more detailed information about the element it is describing. It can span multiple lines and provide comprehensive help text.',
    show: true,
    position: 'top',
    alignCaret: 'center',
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
        
        <Tooltip 
          show={showTooltip}
          position="top"
          alignCaret="center"
          staticPositioning={true}
        >
          This tooltip appears on hover!
        </Tooltip>
      </div>
    )
  },
}

// Multiple tooltips demonstration
export const MultipleTooltips: Story = {
  render: () => {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
    
    const tooltips = [
      { id: 'save', text: 'Save your work', position: 'top' as const },
      { id: 'edit', text: 'Edit this item', position: 'bottom' as const },
      { id: 'delete', text: 'Delete permanently', position: 'top' as const },
    ]
    
    return (
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {tooltips.map((tooltip) => (
          <div key={tooltip.id} style={{ position: 'relative' }}>
            <Button
              buttonStyle="secondary"
              size="small"
              onMouseEnter={() => setActiveTooltip(tooltip.id)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {tooltip.id.charAt(0).toUpperCase() + tooltip.id.slice(1)}
            </Button>
            
            <Tooltip
              show={activeTooltip === tooltip.id}
              position={tooltip.position}
              alignCaret="center"
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
    const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right']
    
    return (
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {alignments.map((alignment) => (
          <div key={alignment} style={{ position: 'relative' }}>
            <div style={{ 
              width: '80px', 
              height: '40px', 
              backgroundColor: '#e0e0e0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px'
            }}>
              {alignment}
            </div>
            
            <Tooltip
              show={true}
              position="top"
              alignCaret={alignment}
              staticPositioning={true}
            >
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
      <div style={{ 
        display: 'flex', 
        gap: '60px', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '100px', 
            height: '40px', 
            backgroundColor: '#007acc', 
            color: 'white',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '4px'
          }}>
            Top Tooltip
          </div>
          
          <Tooltip
            show={true}
            position="top"
            alignCaret="center"
            staticPositioning={true}
          >
            Positioned above
          </Tooltip>
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '100px', 
            height: '40px', 
            backgroundColor: '#28a745', 
            color: 'white',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '4px'
          }}>
            Bottom Tooltip
          </div>
          
          <Tooltip
            show={true}
            position="bottom"
            alignCaret="center"
            staticPositioning={true}
          >
            Positioned below
          </Tooltip>
        </div>
      </div>
    )
  },
}