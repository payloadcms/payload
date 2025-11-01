import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

let Button: any
let buttonError: null | string = null

try {
  const ButtonModule = require('../../packages/ui/src/elements/Button')
  Button = ButtonModule.Button
} catch (e) {
  buttonError = (e as Error).message
}

const ButtonTest = () => {
  if (buttonError) {
    return (
      <div style={{ border: '2px solid red', borderRadius: '8px', padding: '20px' }}>
        <h3>❌ Button Import Failed</h3>
        <pre style={{ background: '#f0f0f0', fontSize: '12px', padding: '10px' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Button buttonStyle="primary">Primary</Button>
          <Button buttonStyle="secondary">Secondary</Button>
          <Button buttonStyle="pill">Pill</Button>
          <Button buttonStyle="none">None</Button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Buttons with Icons (should work)</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Button buttonStyle="primary" icon="plus">
            With Plus
          </Button>
          <Button buttonStyle="secondary" icon="edit">
            With Edit
          </Button>
          <Button buttonStyle="none" icon="trash" />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Button Sizes (should work)</h4>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Button buttonStyle="primary" size="small">
            Small
          </Button>
          <Button buttonStyle="primary" size="medium">
            Medium
          </Button>
          <Button buttonStyle="primary" size="large">
            Large
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Button with Link (might fail)</h4>
        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '10px',
          }}
        >
          <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>
            This might cause the router error:
          </p>
          <Button buttonStyle="primary" el="link" to="/test">
            Link Button
          </Button>
        </div>
      </div>
    </div>
  )
}

const meta = {
  component: ButtonTest,
  parameters: {
    layout: 'centered',
  },
  title: 'Test/Button Test',
} satisfies Meta<typeof ButtonTest>

export default meta
type Story = StoryObj<typeof meta>

export const ButtonTests: Story = {}
