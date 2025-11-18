import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  component: Button,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <Story />
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  title: 'UI/Elements/Button with Providers',
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

export const WithIcon: Story = {
  args: {
    buttonStyle: 'primary',
    children: 'Add Item',
    icon: 'plus',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button buttonStyle="primary">Primary</Button>
        <Button buttonStyle="secondary">Secondary</Button>
        <Button buttonStyle="pill">Pill</Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button buttonStyle="primary" icon="plus">
          With Plus Icon
        </Button>
        <Button buttonStyle="secondary" icon="edit">
          With Edit Icon
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button buttonStyle="primary" size="small">
          Small
        </Button>
        <Button buttonStyle="primary" size="medium">
          Medium
        </Button>
        <Button buttonStyle="primary" size="large">
          Large
        </Button>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button buttonStyle="primary" disabled>
          Disabled
        </Button>
        <Button buttonStyle="secondary" disabled>
          Disabled Secondary
        </Button>
      </div>
    </div>
  ),
}
