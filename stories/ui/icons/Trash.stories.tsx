import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TrashIcon } from '../../../packages/ui/src/icons/Trash'

const meta = {
  component: TrashIcon,
  parameters: {
    docs: {
      description: {
        component: 'Trash icon used for delete actions throughout Payload CMS.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Icons/Trash',
} satisfies Meta<typeof TrashIcon>

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

export const Danger: Story = {
  args: {
    style: { color: '#dc3545', height: '24px', width: '24px' },
  },
}
