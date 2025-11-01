import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../packages/ui/src/elements/Button'
import { Card } from '../../packages/ui/src/elements/Card'

const CardTest = () => {
  return (
    <div style={{ maxWidth: '400px', padding: '20px' }}>
      <h3>Card Component Tests</h3>

      {/* Basic Card - no onClick or href */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Basic Card (no link functionality)</h4>
        <Card title="Simple Card Title" />
      </div>

      {/* Card with actions but no link */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Card with Actions (no link)</h4>
        <Card
          actions={
            <Button buttonStyle="primary" size="small">
              Action Button
            </Button>
          }
          title="Card with Actions"
        />
      </div>

      {/* Test Card with onClick - this might fail */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Card with onClick (might fail)</h4>
        <Card
          buttonAriaLabel="Click to test"
          onClick={() => alert('Card clicked!')}
          title="Clickable Card"
        />
      </div>
    </div>
  )
}

const meta = {
  component: CardTest,
  parameters: {
    layout: 'centered',
  },
  title: 'Test/Card Test',
} satisfies Meta<typeof CardTest>

export default meta
type Story = StoryObj<typeof meta>

export const CardTests: Story = {}
