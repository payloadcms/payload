/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { XIcon } from '../icons/X/index.js'
import { Pill } from '../Pill/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Pill> = {
  args: {
    children: 'Pill Content',
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the pill',
    },
    alignIcon: {
      control: 'select',
      description: 'Position of the icon relative to text',
      options: ['left', 'right'],
    },
    'aria-checked': {
      control: 'boolean',
      description: 'Whether the pill is checked (for toggle pills)',
    },
    'aria-controls': {
      control: 'text',
      description: 'ID of element controlled by this pill',
    },
    'aria-expanded': {
      control: 'boolean',
      description: 'Whether the pill controls an expanded element',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the pill',
    },
    children: {
      control: 'text',
      description: 'Content to display in the pill',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    draggable: {
      control: 'boolean',
      description: 'Whether the pill is draggable',
    },
    icon: {
      control: 'text',
      description: 'Icon to display in the pill',
    },
    onClick: {
      action: 'clicked',
      description: 'Function to call when pill is clicked',
    },
    pillStyle: {
      control: 'select',
      description: 'Visual style variant of the pill',
      options: [
        'always-white',
        'dark',
        'error',
        'light',
        'light-gray',
        'success',
        'warning',
        'white',
      ],
    },
    rounded: {
      control: 'boolean',
      description: 'Whether the pill has rounded corners',
    },
    size: {
      control: 'select',
      description: 'Size of the pill',
      options: ['medium', 'small'],
    },
    to: {
      control: 'text',
      description: 'URL to navigate to when clicked',
    },
  },
  component: Pill,
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
        component:
          'A versatile pill component that can display content, icons, and be interactive.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Pill',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    children: 'Basic Pill',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Pill with Icon',
    icon: <XIcon />,
  },
}

export const WithIconLeft: Story = {
  args: {
    alignIcon: 'left',
    children: 'Icon Left',
    icon: <XIcon />,
  },
}

export const WithIconRight: Story = {
  args: {
    alignIcon: 'right',
    children: 'Icon Right',
    icon: <XIcon />,
  },
}

// Style variants
export const Light: Story = {
  args: {
    children: 'Light Pill',
    pillStyle: 'light',
  },
}

export const Dark: Story = {
  args: {
    children: 'Dark Pill',
    pillStyle: 'dark',
  },
}

export const Success: Story = {
  args: {
    children: 'Success Pill',
    pillStyle: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning Pill',
    pillStyle: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Error Pill',
    pillStyle: 'error',
  },
}

export const White: Story = {
  args: {
    children: 'White Pill',
    pillStyle: 'white',
  },
}

export const LightGray: Story = {
  args: {
    children: 'Light Gray Pill',
    pillStyle: 'light-gray',
  },
}

export const AlwaysWhite: Story = {
  args: {
    children: 'Always White Pill',
    pillStyle: 'always-white',
  },
}

// Sizes
export const Small: Story = {
  args: {
    children: 'Small Pill',
    size: 'small',
  },
}

export const Medium: Story = {
  args: {
    children: 'Medium Pill',
    size: 'medium',
  },
}

// Interactive variants
export const Clickable: Story = {
  args: {
    children: 'Clickable Pill',
    onClick: () => alert('Pill clicked!'),
  },
}

export const WithLink: Story = {
  args: {
    children: 'Pill with Link',
    to: '#',
  },
}

export const Rounded: Story = {
  args: {
    children: 'Rounded Pill',
    rounded: true,
  },
}

export const Draggable: Story = {
  args: {
    children: 'Draggable Pill',
    draggable: true,
  },
}

// States
export const Checked: Story = {
  args: {
    'aria-checked': true,
    children: 'Checked Pill',
    pillStyle: 'success',
  },
}

export const Expanded: Story = {
  args: {
    'aria-expanded': true,
    children: 'Expanded Pill',
  },
}

// Complex examples
export const FullFeatured: Story = {
  args: {
    'aria-label': 'Remove item',
    children: 'Remove Item',
    icon: <XIcon />,
    onClick: () => alert('Remove clicked!'),
    pillStyle: 'error',
    size: 'small',
  },
}

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available pill variants, styles, and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Styles */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Styles</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill pillStyle="light">Light</Pill>
          <Pill pillStyle="dark">Dark</Pill>
          <Pill pillStyle="success">Success</Pill>
          <Pill pillStyle="warning">Warning</Pill>
          <Pill pillStyle="error">Error</Pill>
          <Pill pillStyle="white">White</Pill>
          <Pill pillStyle="light-gray">Light Gray</Pill>
          <Pill pillStyle="always-white">Always White</Pill>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Sizes</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill size="small">Small</Pill>
          <Pill size="medium">Medium</Pill>
        </div>
      </div>

      {/* With Icons */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>With Icons</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill icon={<XIcon />}>Icon Right</Pill>
          <Pill alignIcon="left" icon={<XIcon />}>
            Icon Left
          </Pill>
        </div>
      </div>

      {/* Interactive */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Interactive</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill onClick={() => alert('Clicked!')}>Clickable</Pill>
          <Pill to="#">With Link</Pill>
          <Pill rounded>Rounded</Pill>
          <Pill draggable>Draggable</Pill>
        </div>
      </div>

      {/* States */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>States</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill aria-checked={true} pillStyle="success">
            Checked
          </Pill>
          <Pill aria-expanded={true}>Expanded</Pill>
        </div>
      </div>
    </div>
  ),
}
