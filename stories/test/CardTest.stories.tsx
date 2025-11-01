import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Card } from '../../packages/ui/src/elements/Card'
import { Button } from '../../packages/ui/src/elements/Button'

const CardTest = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
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
          title="Card with Actions" 
          actions={
            <Button buttonStyle="primary" size="small">
              Action Button
            </Button>
          }
        />
      </div>
      
      {/* Test Card with onClick - this might fail */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Card with onClick (might fail)</h4>
        <Card 
          title="Clickable Card" 
          onClick={() => alert('Card clicked!')}
          buttonAriaLabel="Click to test"
        />
      </div>
    </div>
  )
}

const meta = {
  title: 'Test/Card Test',
  component: CardTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CardTest>

export default meta
type Story = StoryObj<typeof meta>

export const CardTests: Story = {}