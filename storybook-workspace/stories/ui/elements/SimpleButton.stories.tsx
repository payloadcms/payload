import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'

const meta = {
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Elements/Simple Button Test',
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Test basic functionality
export const BasicTest: Story = {
  render: () => {
    return (
      <div style={{ background: '#f0f0f0', padding: '20px' }}>
        <h3>Button Component Test</h3>
        <div style={{ margin: '10px 0' }}>
          <Button buttonStyle="primary">Primary Button</Button>
        </div>
        <div style={{ margin: '10px 0' }}>
          <Button buttonStyle="secondary">Secondary Button</Button>
        </div>
        <div style={{ margin: '10px 0' }}>
          <Button buttonStyle="pill">Pill Button</Button>
        </div>
      </div>
    )
  },
}

export const WithIcon: Story = {
  render: () => {
    return (
      <div style={{ background: '#f0f0f0', padding: '20px' }}>
        <h3>Button with Icon Test</h3>
        <div style={{ margin: '10px 0' }}>
          <Button buttonStyle="primary" icon="plus">
            Add Item
          </Button>
        </div>
        <div style={{ margin: '10px 0' }}>
          <Button buttonStyle="secondary" icon="edit">
            Edit Item
          </Button>
        </div>
      </div>
    )
  },
}
