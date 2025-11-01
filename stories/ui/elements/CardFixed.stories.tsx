import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Card } from '../../../packages/ui/src/elements/Card'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Card (Fixed)',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component - testing basic functionality first.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '400px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Test the most basic case first
export const BasicCard: Story = {
  render: () => {
    try {
      return <Card title="Basic Card Title" />
    } catch (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b' }}>
          <h3>❌ Card Error</h3>
          <pre>{error.toString()}</pre>
        </div>
      )
    }
  },
}

// Test with actions
export const WithSimpleActions: Story = {
  render: () => {
    try {
      return (
        <Card 
          title="Card with Actions"
          actions={
            <Button buttonStyle="primary" size="small">
              Action
            </Button>
          }
        />
      )
    } catch (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b' }}>
          <h3>❌ Card with Actions Error</h3>
          <pre>{error.toString()}</pre>
        </div>
      )
    }
  },
}

// Test with onClick only (no href/link)
export const WithClickHandler: Story = {
  render: () => {
    try {
      return (
        <Card 
          title="Clickable Card"
          onClick={() => console.log('Card clicked!')}
        />
      )
    } catch (error) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b' }}>
          <h3>❌ Clickable Card Error</h3>
          <pre>{error.toString()}</pre>
        </div>
      )
    }
  },
}

// Debug what props are being passed
export const DebugCard: Story = {
  render: () => {
    const cardProps = {
      title: "Debug Card",
      id: "debug-card-123"
    }
    
    return (
      <div>
        <h3>Card Props Debug:</h3>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          {JSON.stringify(cardProps, null, 2)}
        </pre>
        
        <div style={{ border: '2px solid #007acc', padding: '16px' }}>
          <Card {...cardProps} />
        </div>
      </div>
    )
  },
}

// Test if the issue is with the Button component
export const DirectButtonTest: Story = {
  render: () => {
    return (
      <div>
        <h3>Direct Button Test:</h3>
        <div style={{ marginBottom: '16px' }}>
          <Button buttonStyle="primary">Direct Button</Button>
        </div>
        
        <h3>Card Component:</h3>
        <div style={{ border: '2px solid #007acc', padding: '16px' }}>
          <Card title="Card Test" />
        </div>
      </div>
    )
  },
}