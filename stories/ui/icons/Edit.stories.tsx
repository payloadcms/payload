import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EditIcon } from '../../../packages/ui/src/icons/Edit'

const meta = {
  title: 'UI/Icons/Edit',
  component: EditIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Edit icon used for edit actions throughout Payload CMS.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EditIcon>

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