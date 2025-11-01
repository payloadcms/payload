import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EditIcon } from '../../../packages/ui/src/icons/Edit'

const meta = {
  component: EditIcon,
  parameters: {
    docs: {
      description: {
        component: 'Edit icon used for edit actions throughout Payload CMS.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Icons/Edit',
} satisfies Meta<typeof EditIcon>

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
