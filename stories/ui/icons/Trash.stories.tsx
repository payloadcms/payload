import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TrashIcon } from '../../../packages/ui/src/icons/Trash'

const meta = {
  title: 'UI/Icons/Trash',
  component: TrashIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Trash icon used for delete actions throughout Payload CMS.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TrashIcon>

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

export const Danger: Story = {
  args: {
    style: { color: '#dc3545', width: '24px', height: '24px' }
  },
}