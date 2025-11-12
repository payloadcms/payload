import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EditIcon } from '@payloadcms/ui'

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
      <div
        style={{
          color: 'var(--theme-input-bg)',
          transform: 'scale(1.2)',
          transformOrigin: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
}
