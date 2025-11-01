import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from '../../../packages/ui/src/elements/Button'

const meta = {
  title: 'UI/Elements/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Payload CMS Button component - the primary button component used throughout the admin interface.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    buttonStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'pill', 'none'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select', 
      options: ['small', 'medium', 'large'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    icon: {
      control: 'text',
      description: 'Icon to display in the button',
    },
  },
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
    size: 'small',
    children: 'Small Button',
  },
}

export const Large: Story = {
  args: {
    buttonStyle: 'primary',
    size: 'large',
    children: 'Large Button',
  },
}

export const Disabled: Story = {
  args: {
    buttonStyle: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
}

export const WithIcon: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Button with Icon',
    icon: 'plus',
  },
}