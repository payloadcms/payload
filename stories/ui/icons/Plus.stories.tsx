import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PlusIcon } from '../../../packages/ui/src/icons/Plus'

const meta = {
  title: 'UI/Icons/Plus',
  component: PlusIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Plus icon used throughout Payload CMS for adding new items.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
} satisfies Meta<typeof PlusIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Large: Story = {
  args: {
    style: { width: '32px', height: '32px' }
  },
}

export const Small: Story = {
  args: {
    style: { width: '16px', height: '16px' }
  },
}

export const Colored: Story = {
  args: {
    style: { color: '#007acc', width: '24px', height: '24px' }
  },
}