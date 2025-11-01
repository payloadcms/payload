import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'

const SimpleTestComponent = () => {
  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid green', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff'
    }}>
      <h2>✅ Storybook is Working!</h2>
      <p>This is a simple test component to verify Storybook is functioning correctly.</p>
      <button 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007acc', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  )
}

const meta = {
  title: 'Test/Basic Test',
  component: SimpleTestComponent,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SimpleTestComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Working: Story = {}