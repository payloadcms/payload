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
  decorators: [
    (Story) => (
      <div style={{ transform: 'scale(1.6)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}

export const Small: Story = {
  decorators: [
    (Story) => (
      <div style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}

export const Colored: Story = {
  decorators: [
    (Story) => (
      <div style={{ color: '#007acc', transform: 'scale(1.2)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}
