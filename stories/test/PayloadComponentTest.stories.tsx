import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'

// Direct ES import instead of require
import { PlusIcon } from '../../packages/ui/src/icons/Plus'

const PayloadComponentTest = () => {
  return (
    <div style={{ padding: '20px', border: '2px solid green', borderRadius: '8px' }}>
      <h3>✅ Payload Icon Test</h3>
      <p>Successfully imported and rendered PlusIcon using ES imports:</p>
      <div style={{ fontSize: '32px', margin: '20px 0', textAlign: 'center' }}>
        <PlusIcon />
      </div>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#155724'
      }}>
        ✓ Icon component imported and rendered successfully!
      </div>
    </div>
  )
}

const meta = {
  title: 'Test/Payload Component Test',
  component: PayloadComponentTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PayloadComponentTest>

export default meta
type Story = StoryObj<typeof meta>

export const IconTest: Story = {}