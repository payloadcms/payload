import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../../../packages/ui/src/elements/Button'

const meta = {
  argTypes: {
    buttonStyle: {
      control: 'select',
      description: 'The visual style of the button',
      options: ['primary', 'secondary', 'pill', 'none'],
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    icon: {
      control: 'text',
      description: 'Icon to display in the button',
    },
    size: {
      control: 'select',
      description: 'The size of the button',
      options: ['small', 'medium', 'large'],
    },
  },
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Payload CMS Button component - the primary button component used throughout the admin interface.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Elements/Button',
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    buttonStyle: 'secondary',
    children: 'Secondary Button',
  },
}

export const Pill: Story = {
  args: {
    buttonStyle: 'pill',
    children: 'Pill Button',
  },
}

export const Small: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Small Button',
    size: 'small',
  },
}

export const Large: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Large Button',
    size: 'large',
  },
}

export const Disabled: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
}

export const WithIcon: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Button with Icon',
    icon: 'plus',
  },
}
