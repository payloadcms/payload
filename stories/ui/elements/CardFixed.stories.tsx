import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { Card } from '../../../packages/ui/src/elements/Card'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  component: Card,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '400px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Card component - testing basic functionality first.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Card (Fixed)',
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
        <div style={{ backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b', padding: '20px' }}>
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
          actions={
            <Button buttonStyle="primary" size="small">
              Action
            </Button>
          }
          title="Card with Actions"
        />
      )
    } catch (error) {
      return (
        <div style={{ backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b', padding: '20px' }}>
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
      return <Card onClick={() => console.log('Card clicked!')} title="Clickable Card" />
    } catch (error) {
      return (
        <div style={{ backgroundColor: '#ffe6e6', border: '1px solid #ff6b6b', padding: '20px' }}>
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
      id: 'debug-card-123',
      title: 'Debug Card',
    }

    return (
      <div>
        <h3>Card Props Debug:</h3>
        <pre
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '16px',
            padding: '12px',
          }}
        >
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
