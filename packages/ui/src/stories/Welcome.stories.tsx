import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

const meta: Meta = {
  parameters: {
    docs: {
      description: {
        component: 'Welcome to the Payload UI Storybook!',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Welcome',
}

export default meta
type Story = StoryObj<typeof meta>

export const Welcome: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A welcome page introducing the Payload UI Storybook and its features.',
      },
    },
  },
  render: () => (
    <div style={{ lineHeight: '1.6', margin: '0 auto', maxWidth: '800px', padding: '40px' }}>
      <h1 style={{ color: '#1a1a1a', marginBottom: '24px' }}>Welcome to Payload UI Storybook</h1>

      <p style={{ color: '#666', fontSize: '18px', marginBottom: '24px' }}>
        This is the Storybook for the Payload UI component library. Here you can explore and test
        all the UI components used throughout Payload CMS.
      </p>

      <h2 style={{ color: '#1a1a1a', marginBottom: '16px', marginTop: '32px' }}>Getting Started</h2>

      <ul style={{ marginBottom: '24px' }}>
        <li style={{ marginBottom: '8px' }}>
          <strong>Elements</strong>: Core UI components like buttons, inputs, and other interactive
          elements
        </li>
        <li style={{ marginBottom: '8px' }}>
          <strong>Fields</strong>: Form field components for the admin interface
        </li>
        <li style={{ marginBottom: '8px' }}>
          <strong>Icons</strong>: Icon library used throughout the interface
        </li>
        <li style={{ marginBottom: '8px' }}>
          <strong>Views</strong>: Complex view components for different admin screens
        </li>
      </ul>

      <h2 style={{ color: '#1a1a1a', marginBottom: '16px', marginTop: '32px' }}>Navigation</h2>

      <p style={{ marginBottom: '24px' }}>
        Use the sidebar to navigate between different component categories and their stories. Each
        story demonstrates different variants, states, and use cases for the components.
      </p>

      <h2 style={{ color: '#1a1a1a', marginBottom: '16px', marginTop: '32px' }}>
        Interactive Controls
      </h2>

      <p style={{ marginBottom: '24px' }}>
        Most stories include interactive controls in the <strong>Controls</strong> panel, allowing
        you to modify component props in real-time and see how they affect the component's
        appearance and behavior.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '32px 0' }} />

      <p style={{ color: '#666', fontSize: '18px', textAlign: 'center' }}>
        <strong>Happy exploring!</strong> 🎉
      </p>
    </div>
  ),
}
