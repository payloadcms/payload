import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../elements/Button/index.js'
import { ChevronIcon } from '../icons/Chevron/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Button> = {
  args: {
    onClick: () => {},
  },
  argTypes: {
    buttonStyle: {
      control: 'select',
      description: 'The visual style variant of the button',
      options: [
        'primary',
        'secondary',
        'subtle',
        'transparent',
        'error',
        'pill',
        'icon-label',
        'none',
        'tab',
      ],
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    el: {
      control: 'select',
      description: 'The HTML element to render',
      options: ['button', 'anchor', 'link'],
    },
    iconPosition: {
      control: 'select',
      description: 'Position of the icon relative to text',
      options: ['left', 'right'],
    },
    iconStyle: {
      control: 'select',
      description: 'Styling variant for the icon',
      options: ['none', 'with-border', 'without-border'],
    },
    margin: {
      control: 'boolean',
      description: 'Whether to apply default margin',
    },
    newTab: {
      control: 'boolean',
      description: 'Whether to open links in a new tab (for anchor/link elements)',
    },
    round: {
      control: 'boolean',
      description: 'Whether the button has rounded corners',
    },
    size: {
      control: 'select',
      description: 'The size of the button',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text to show on hover',
    },
  },
  component: Button,
  decorators: [(Story) => <Story />],
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple styles, sizes, and configurations.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Button',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Primary: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Primary Button',
  },
  render: (args) => <Button {...args} />,
}

export const Secondary: Story = {
  args: {
    buttonStyle: 'secondary',
    children: 'Secondary Button',
  },
}

export const Subtle: Story = {
  args: {
    buttonStyle: 'subtle',
    children: 'Subtle Button',
  },
}

export const Transparent: Story = {
  args: {
    buttonStyle: 'transparent',
    children: 'Transparent Button',
  },
}

export const Error: Story = {
  args: {
    buttonStyle: 'error',
    children: 'Error Button',
  },
}

export const Pill: Story = {
  args: {
    buttonStyle: 'pill',
    children: 'Pill Button',
  },
}

// Sizes
export const ExtraSmall: Story = {
  args: {
    children: 'Extra Small',
    size: 'xsmall',
  },
}

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
}

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'medium',
  },
}

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
}

// With icons
export const WithIconRight: Story = {
  args: {
    children: 'Add Item',
    icon: 'plus',
    iconPosition: 'right',
  },
}

export const WithIconLeft: Story = {
  args: {
    children: 'Edit',
    icon: 'edit',
    iconPosition: 'left',
  },
}

export const IconOnly: Story = {
  args: {
    'aria-label': 'Close',
    icon: 'x',
  },
}

export const CustomIcon: Story = {
  args: {
    children: 'Custom Icon',
    icon: <ChevronIcon />,
  },
}

// Icon styles
export const IconWithBorder: Story = {
  args: {
    children: 'Add with Border',
    icon: 'plus',
    iconStyle: 'with-border',
  },
}

export const IconWithoutBorder: Story = {
  args: {
    children: 'Add without Border',
    icon: 'plus',
    iconStyle: 'without-border',
  },
}

// States
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

export const DisabledPrimary: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Disabled Primary',
    disabled: true,
  },
}

// Round variant
export const Round: Story = {
  args: {
    children: 'Round Button',
    round: true,
  },
}

export const RoundIconOnly: Story = {
  args: {
    'aria-label': 'Add',
    icon: 'plus',
    round: true,
  },
}

// With tooltip
export const WithTooltip: Story = {
  args: {
    children: 'Hover for tooltip',
    tooltip: 'This is a helpful tooltip',
  },
}

// Different elements
export const AsLink: Story = {
  args: {
    children: 'Link Button',
    el: 'link',
    to: '#',
  },
}

export const AsAnchor: Story = {
  args: {
    children: 'External Link',
    el: 'anchor',
    newTab: true,
    url: 'https://payloadcms.com',
  },
}

// Combinations
export const LargePrimaryWithIcon: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Create New',
    icon: 'plus',
    iconPosition: 'left',
    size: 'large',
  },
}

export const SmallSecondaryIconOnly: Story = {
  args: {
    'aria-label': 'Edit item',
    buttonStyle: 'secondary',
    icon: 'edit',
    size: 'small',
  },
}

export const ErrorWithTooltip: Story = {
  args: {
    buttonStyle: 'error',
    children: 'Delete',
    icon: 'x',
    tooltip: 'This action cannot be undone',
  },
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available button variants, sizes, and configurations.',
      },
    },
  },
  render: () => (
    <div
      style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button buttonStyle="primary">Primary</Button>
        <Button buttonStyle="secondary">Secondary</Button>
        <Button buttonStyle="subtle">Subtle</Button>
        <Button buttonStyle="transparent">Transparent</Button>
        <Button buttonStyle="error">Error</Button>
        <Button buttonStyle="pill">Pill</Button>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button size="xsmall">Extra Small</Button>
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button icon="plus" iconPosition="left">
          Add Item
        </Button>
        <Button icon="edit" iconPosition="right">
          Edit
        </Button>
        <Button aria-label="Close" icon="x" />
        <Button icon="plus" iconStyle="with-border">
          With Border
        </Button>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button round>Round</Button>
        <Button aria-label="Add" icon="plus" round />
        <Button disabled>Disabled</Button>
        <Button tooltip="This is a tooltip">With Tooltip</Button>
      </div>
    </div>
  ),
}
