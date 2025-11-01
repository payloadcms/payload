import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'

let Button: any
let buttonError: string | null = null

try {
  const ButtonModule = require('../../packages/ui/src/elements/Button')
  Button = ButtonModule.Button
} catch (e) {
  buttonError = (e as Error).message
}

const ButtonTest = () => {
  if (buttonError) {
    return (
      <div style={{ padding: '20px', border: '2px solid red', borderRadius: '8px' }}>
        <h3>❌ Button Import Failed</h3>
        <pre style={{ fontSize: '12px', background: '#f0f0f0', padding: '10px' }}>
          {buttonError}
        </pre>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3>Button Component Tests</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Basic Buttons (should work)</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button buttonStyle="primary">Primary</Button>
          <Button buttonStyle="secondary">Secondary</Button>
          <Button buttonStyle="pill">Pill</Button>
          <Button buttonStyle="none">None</Button>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Buttons with Icons (should work)</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button buttonStyle="primary" icon="plus">With Plus</Button>
          <Button buttonStyle="secondary" icon="edit">With Edit</Button>
          <Button buttonStyle="none" icon="trash" />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Button Sizes (should work)</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button buttonStyle="primary" size="small">Small</Button>
          <Button buttonStyle="primary" size="medium">Medium</Button>
          <Button buttonStyle="primary" size="large">Large</Button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Button with Link (might fail)</h4>
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>This might cause the router error:</p>
          <Button buttonStyle="primary" el="link" to="/test">Link Button</Button>
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'Test/Button Test',
  component: ButtonTest,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ButtonTest>

export default meta
type Story = StoryObj<typeof meta>

export const ButtonTests: Story = {}