import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { LoadingOverlay, LoadingOverlayToggle, FormLoadingOverlayToggle } from '../../../packages/ui/src/elements/Loading'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/LoadingOverlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading overlay component with animated bars used throughout Payload CMS for async operations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <Story />
      </PayloadMockProviders>
    ),
  ],
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
    show: true,
    loadingText: 'Saving your changes...',
  },
}

export const Hidden: Story = {
  args: {
    show: false,
    loadingText: 'This loading overlay is hidden',
  },
}

export const SlowAnimation: Story = {
  args: {
    show: true,
    loadingText: 'Slow loading animation',
    animationDuration: '2000ms',
  },
}

export const FastAnimation: Story = {
  args: {
    show: true,
    loadingText: 'Fast loading animation', 
    animationDuration: '200ms',
  },
}

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false)
    const [customText, setCustomText] = useState('')
    
    return (
      <div style={{ padding: '20px', minHeight: '300px', position: 'relative' }}>
        <h3>Interactive Loading Overlay</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Custom Loading Text:
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom loading text..."
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '300px'
            }}
          />
        </div>
        
        <button
          onClick={() => setIsLoading(!isLoading)}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#dc3545' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Stop Loading' : 'Start Loading'}
        </button>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          border: '2px dashed #ccc', 
          borderRadius: '8px',
          minHeight: '100px',
          position: 'relative',
          backgroundColor: '#f8f9fa'
        }}>
          <p>Content area that would be covered by loading overlay</p>
          <p>Click the button above to toggle the loading state</p>
          
          {isLoading && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <LoadingOverlay 
                show={isLoading}
                loadingText={customText || undefined}
              />
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginTop: '20px' 
        }}>
          {loadingMessages.map((message, index) => (
            <div key={index} style={{ 
              position: 'relative', 
              height: '120px', 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              <LoadingOverlay 
                show={true}
                loadingText={message}
              />
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
      { name: 'Small', width: 200, height: 100 },
      { name: 'Medium', width: 300, height: 150 },
      { name: 'Large', width: 400, height: 200 },
    ]
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Different Container Sizes</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginTop: '20px' }}>
          {sizes.map(({ name, width, height }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <h4 style={{ marginBottom: '8px' }}>{name}</h4>
              <div style={{ 
                position: 'relative', 
                width: `${width}px`, 
                height: `${height}px`,
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}>
                <LoadingOverlay 
                  show={true}
                  loadingText={`${name} loading...`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}