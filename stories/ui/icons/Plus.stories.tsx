import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PlusIcon } from '../../../packages/ui/src/icons/Plus'

const meta = {
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
  component: PlusIcon,
  parameters: {
    docs: {
      description: {
        component: 'Plus icon used throughout Payload CMS for adding new items.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Icons/Plus',
} satisfies Meta<typeof PlusIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Large: Story = {
  args: {
    style: { height: '32px', width: '32px' },
  },
}

export const Small: Story = {
  args: {
    style: { height: '16px', width: '16px' },
  },
}

export const Colored: Story = {
  args: {
    style: { color: '#007acc', height: '24px', width: '24px' },
  },
}
