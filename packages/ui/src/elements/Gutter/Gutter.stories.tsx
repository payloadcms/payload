import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Gutter } from '../Gutter/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Gutter> = {
  args: {
    children: 'Gutter content',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display inside the gutter',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    left: {
      control: 'boolean',
      description: 'Whether to apply left padding',
    },
    negativeLeft: {
      control: 'boolean',
      description: 'Whether to apply negative left margin',
    },
    negativeRight: {
      control: 'boolean',
      description: 'Whether to apply negative right margin',
    },
    right: {
      control: 'boolean',
      description: 'Whether to apply right padding',
    },
  },
  component: Gutter,
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
        component: 'A gutter component that provides consistent spacing and padding.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Elements/Gutter',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    children: 'Basic gutter with default padding',
  },
}

export const NoLeftPadding: Story = {
  args: {
    children: 'Gutter without left padding',
    left: false,
  },
}

export const NoRightPadding: Story = {
  args: {
    children: 'Gutter without right padding',
    right: false,
  },
}

export const NoPadding: Story = {
  args: {
    children: 'Gutter without any padding',
    left: false,
    right: false,
  },
}

export const WithNegativeLeft: Story = {
  args: {
    children: 'Gutter with negative left margin',
    negativeLeft: true,
  },
}

export const WithNegativeRight: Story = {
  args: {
    children: 'Gutter with negative right margin',
    negativeRight: true,
  },
}

export const WithNegativeBoth: Story = {
  args: {
    children: 'Gutter with negative margins on both sides',
    negativeLeft: true,
    negativeRight: true,
  },
}

export const WithCustomClassName: Story = {
  args: {
    children: 'Gutter with custom class',
    className: 'custom-gutter',
  },
}

// Complex content
export const WithComplexContent: Story = {
  args: {
    children: (
      <div>
        <h2 style={{ margin: '0 0 16px 0' }}>Complex Content</h2>
        <p style={{ margin: '0 0 16px 0' }}>
          This gutter contains complex content with multiple elements and styling.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px 16px' }}>
            Action 1
          </button>
          <button style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px 16px' }}>
            Action 2
          </button>
        </div>
      </div>
    ),
  },
}

// Layout examples
export const FullWidthLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A full-width layout example using gutters.',
      },
    },
  },
  render: () => (
    <div style={{ width: '100%' }}>
      <Gutter>
        <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px 0' }}>Full Width Section</h2>
          <p style={{ margin: 0 }}>
            This content uses the full width of the container with proper gutters.
          </p>
        </div>
      </Gutter>
    </div>
  ),
}

export const NestedGutters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'An example of nested gutters for complex layouts.',
      },
    },
  },
  render: () => (
    <div style={{ width: '100%' }}>
      <Gutter>
        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px 0' }}>Outer Gutter</h2>
          <Gutter left={false} right={false}>
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Inner Gutter</h3>
              <p style={{ margin: 0 }}>
                This content is inside a nested gutter with no left/right padding.
              </p>
            </div>
          </Gutter>
        </div>
      </Gutter>
    </div>
  ),
}

export const ResponsiveLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A responsive layout example showing different gutter configurations.',
      },
    },
  },
  render: () => (
    <div style={{ width: '100%' }}>
      <Gutter>
        <div
          style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          <Gutter left={false} right={false}>
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Card 1</h3>
              <p style={{ margin: 0 }}>Content without gutters</p>
            </div>
          </Gutter>
          <Gutter left={false} right={false}>
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Card 2</h3>
              <p style={{ margin: 0 }}>Content without gutters</p>
            </div>
          </Gutter>
          <Gutter left={false} right={false}>
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Card 3</h3>
              <p style={{ margin: 0 }}>Content without gutters</p>
            </div>
          </Gutter>
        </div>
      </Gutter>
    </div>
  ),
}

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available gutter variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ marginBottom: '12px' }}>Default (left and right padding)</h3>
        <Gutter>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            Default gutter
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>No left padding</h3>
        <Gutter left={false}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            No left padding
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>No right padding</h3>
        <Gutter right={false}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            No right padding
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>No padding</h3>
        <Gutter left={false} right={false}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            No padding
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>Negative left margin</h3>
        <Gutter negativeLeft={true}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            Negative left margin
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>Negative right margin</h3>
        <Gutter negativeRight={true}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            Negative right margin
          </div>
        </Gutter>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px' }}>Negative both margins</h3>
        <Gutter negativeLeft={true} negativeRight={true}>
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: '4px', padding: '12px' }}>
            Negative both margins
          </div>
        </Gutter>
      </div>
    </div>
  ),
}
