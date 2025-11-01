import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Button with New Icons',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component showcasing the newly added icons: gear and trash.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button icon="chevron" buttonStyle="secondary">
        Chevron
      </Button>
      <Button icon="edit" buttonStyle="secondary">
        Edit
      </Button>
      <Button icon="gear" buttonStyle="secondary">
        Gear (New)
      </Button>
      <Button icon="link" buttonStyle="secondary">
        Link
      </Button>
      <Button icon="plus" buttonStyle="primary">
        Plus
      </Button>
      <Button icon="swap" buttonStyle="secondary">
        Swap
      </Button>
      <Button icon="trash" buttonStyle="error">
        Trash (New)
      </Button>
      <Button icon="x" buttonStyle="secondary">
        X
      </Button>
    </div>
  ),
}

export const NewIconsOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
      <h3>Newly Added Icons</h3>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button icon="gear" buttonStyle="secondary" size="small">
          Settings
        </Button>
        <Button icon="gear" buttonStyle="secondary">
          Configure
        </Button>
        <Button icon="gear" buttonStyle="secondary" size="large">
          Gear Large
        </Button>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Button icon="trash" buttonStyle="error" size="small">
          Delete
        </Button>
        <Button icon="trash" buttonStyle="error">
          Remove
        </Button>
        <Button icon="trash" buttonStyle="error" size="large">
          Trash Large
        </Button>
      </div>
    </div>
  ),
}

export const IconPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
      <h3>Icon Positions</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button icon="gear" iconPosition="left" buttonStyle="secondary">
          Left Gear
        </Button>
        <Button icon="gear" iconPosition="right" buttonStyle="secondary">
          Right Gear
        </Button>
        <Button icon="trash" iconPosition="left" buttonStyle="error">
          Left Trash
        </Button>
        <Button icon="trash" iconPosition="right" buttonStyle="error">
          Right Trash
        </Button>
      </div>
    </div>
  ),
}

export const IconOnlyButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Button icon="gear" buttonStyle="icon-label" aria-label="Settings" />
      <Button icon="trash" buttonStyle="icon-label" aria-label="Delete" />
      <Button icon="edit" buttonStyle="icon-label" aria-label="Edit" />
      <Button icon="plus" buttonStyle="icon-label" aria-label="Add" />
    </div>
  ),
}