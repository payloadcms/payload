import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

// Direct ES import instead of require
import { PlusIcon } from '../../packages/ui/src/icons/Plus'

const PayloadComponentTest = () => {
  return (
    <div style={{ border: '2px solid green', borderRadius: '8px', padding: '20px' }}>
      <h3>✅ Payload Icon Test</h3>
      <p>Successfully imported and rendered PlusIcon using ES imports:</p>
      <div style={{ fontSize: '32px', margin: '20px 0', textAlign: 'center' }}>
        <PlusIcon />
      </div>
      <div
        style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          color: '#155724',
          fontSize: '14px',
          padding: '10px',
        }}
      >
        ✓ Icon component imported and rendered successfully!
      </div>
    </div>
  )
}

const meta = {
  component: PayloadComponentTest,
  parameters: {
    layout: 'centered',
  },
  title: 'Test/Payload Component Test',
} satisfies Meta<typeof PayloadComponentTest>

export default meta
type Story = StoryObj<typeof meta>

export const IconTest: Story = {}
