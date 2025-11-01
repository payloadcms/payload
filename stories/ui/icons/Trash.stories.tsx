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
    className: 'icon-large',
  },
  decorators: [
    (Story) => (
      <div style={{ transform: 'scale(1.6)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}

export const Small: Story = {
  args: {
    className: 'icon-small',
  },
  decorators: [
    (Story) => (
      <div style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}

export const Danger: Story = {
  args: {
    className: 'icon-danger',
  },
  decorators: [
    (Story) => (
      <div style={{ color: '#dc3545', transform: 'scale(1.2)', transformOrigin: 'center' }}>
        <Story />
      </div>
    ),
  ],
}
