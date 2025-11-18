import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import {
  FormLoadingOverlayToggle,
  LoadingOverlay,
  LoadingOverlayToggle,
} from '../../../packages/ui/src/elements/Loading'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  component: LoadingOverlay,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <Story />
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Loading overlay component with animated bars used throughout Payload CMS for async operations.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/LoadingOverlay',
} satisfies Meta<typeof LoadingOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    show: true,
  },
}

export const WithCustomText: Story = {
  args: {
    loadingText: 'Saving your changes...',
    show: true,
  },
}

export const Hidden: Story = {
  args: {
    loadingText: 'This loading overlay is hidden',
    show: false,
  },
}

export const SlowAnimation: Story = {
  args: {
    animationDuration: '2000ms',
    loadingText: 'Slow loading animation',
    show: true,
  },
}

export const FastAnimation: Story = {
  args: {
    animationDuration: '200ms',
    loadingText: 'Fast loading animation',
    show: true,
  },
}

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false)
    const [customText, setCustomText] = useState('')

    return (
      <div style={{ minHeight: '300px', padding: '20px', position: 'relative' }}>
        <h3>Interactive Loading Overlay</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Custom Loading Text:</label>
          <input
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom loading text..."
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxWidth: '300px',
              padding: '8px 12px',
              width: '100%',
            }}
            type="text"
            value={customText}
          />
        </div>

        <button
          onClick={() => setIsLoading(!isLoading)}
          style={{
            backgroundColor: isLoading ? '#dc3545' : '#007acc',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            padding: '10px 20px',
          }}
        >
          {isLoading ? 'Stop Loading' : 'Start Loading'}
        </button>

        <div
          style={{
            backgroundColor: '#f8f9fa',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            marginTop: '20px',
            minHeight: '100px',
            padding: '20px',
            position: 'relative',
          }}
        >
          <p>Content area that would be covered by loading overlay</p>
          <p>Click the button above to toggle the loading state</p>

          {isLoading && (
            <div style={{ inset: 0, position: 'absolute' }}>
              <LoadingOverlay loadingText={customText || undefined} show={isLoading} />
            </div>
          )}
        </div>
      </div>
    )
  },
}

// Different loading messages
export const LoadingMessages: Story = {
  render: () => {
    const loadingMessages = [
      'Loading...',
      'Saving document...',
      'Uploading file...',
      'Processing data...',
      'Generating preview...',
      'Connecting to server...',
    ]

    return (
      <div style={{ padding: '20px' }}>
        <h3>Different Loading Messages</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            marginTop: '20px',
          }}
        >
          {loadingMessages.map((message, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#fafafa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                height: '120px',
                position: 'relative',
              }}
            >
              <LoadingOverlay loadingText={message} show={true} />
            </div>
          ))}
        </div>
      </div>
    )
  },
}

// Size variations
export const SizeVariations: Story = {
  render: () => {
    const sizes = [
      { name: 'Small', height: 100, width: 200 },
      { name: 'Medium', height: 150, width: 300 },
      { name: 'Large', height: 200, width: 400 },
    ]

    return (
      <div style={{ padding: '20px' }}>
        <h3>Different Container Sizes</h3>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: '20px', marginTop: '20px' }}>
          {sizes.map(({ name, height, width }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '8px' }}>{name}</h4>
              <div
                style={{
                  backgroundColor: '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  height: `${height}px`,
                  position: 'relative',
                  width: `${width}px`,
                }}
              >
                <LoadingOverlay loadingText={`${name} loading...`} show={true} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
