import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

const SimpleTestComponent = () => {
  return (
    <div
      style={{
        backgroundColor: '#f0f8ff',
        border: '2px solid green',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h2>✅ Storybook is Working!</h2>
      <p>This is a simple test component to verify Storybook is functioning correctly.</p>
      <button
        onClick={() => alert('Button clicked!')}
        style={{
          backgroundColor: '#007acc',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          padding: '10px 20px',
        }}
      >
        Test Button
      </button>
    </div>
  )
}

const meta = {
  component: SimpleTestComponent,
  parameters: {
    layout: 'centered',
  },
  title: 'Test/Basic Test',
} satisfies Meta<typeof SimpleTestComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Working: Story = {}
