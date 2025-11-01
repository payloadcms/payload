import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  component: Button,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Button component showcasing the newly added icons: gear and trash.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Button with New Icons',
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      <Button buttonStyle="secondary" icon="chevron">
        Chevron
      </Button>
      <Button buttonStyle="secondary" icon="edit">
        Edit
      </Button>
      <Button buttonStyle="secondary" icon="gear">
        Gear (New)
      </Button>
      <Button buttonStyle="secondary" icon="link">
        Link
      </Button>
      <Button buttonStyle="primary" icon="plus">
        Plus
      </Button>
      <Button buttonStyle="secondary" icon="swap">
        Swap
      </Button>
      <Button buttonStyle="error" icon="trash">
        Trash (New)
      </Button>
      <Button buttonStyle="secondary" icon="x">
        X
      </Button>
    </div>
  ),
}

export const NewIconsOnly: Story = {
  render: () => (
    <div
      style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <h3>Newly Added Icons</h3>
      <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
        <Button buttonStyle="secondary" icon="gear" size="small">
          Settings
        </Button>
        <Button buttonStyle="secondary" icon="gear">
          Configure
        </Button>
        <Button buttonStyle="secondary" icon="gear" size="large">
          Gear Large
        </Button>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
        <Button buttonStyle="error" icon="trash" size="small">
          Delete
        </Button>
        <Button buttonStyle="error" icon="trash">
          Remove
        </Button>
        <Button buttonStyle="error" icon="trash" size="large">
          Trash Large
        </Button>
      </div>
    </div>
  ),
}

export const IconPositions: Story = {
  render: () => (
    <div
      style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <h3>Icon Positions</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Button buttonStyle="secondary" icon="gear" iconPosition="left">
          Left Gear
        </Button>
        <Button buttonStyle="secondary" icon="gear" iconPosition="right">
          Right Gear
        </Button>
        <Button buttonStyle="error" icon="trash" iconPosition="left">
          Left Trash
        </Button>
        <Button buttonStyle="error" icon="trash" iconPosition="right">
          Right Trash
        </Button>
      </div>
    </div>
  ),
}

export const IconOnlyButtons: Story = {
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <Button aria-label="Settings" buttonStyle="icon-label" icon="gear" />
      <Button aria-label="Delete" buttonStyle="icon-label" icon="trash" />
      <Button aria-label="Edit" buttonStyle="icon-label" icon="edit" />
      <Button aria-label="Add" buttonStyle="icon-label" icon="plus" />
    </div>
  ),
}
