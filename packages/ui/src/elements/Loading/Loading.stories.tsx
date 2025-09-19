/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { LoadingOverlay } from '../Loading/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof LoadingOverlay> = {
  args: {
    show: true,
  },
  argTypes: {
    animationDuration: {
      control: 'text',
      description: 'Duration of the loading animation',
    },
    loadingText: {
      control: 'text',
      description: 'Text to display while loading',
    },
    overlayType: {
      control: 'select',
      description: 'Type of overlay to display',
      options: ['fullscreen', 'inline', 'overlay'],
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the loading overlay',
    },
  },
  component: LoadingOverlay,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A loading overlay component that displays animated loading indicators.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Elements/Loading',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    loadingText: 'Loading...',
    show: true,
  },
}

export const WithCustomText: Story = {
  args: {
    loadingText: 'Please wait while we process your request',
    show: true,
  },
}

export const WithoutText: Story = {
  args: {
    loadingText: '',
    show: true,
  },
}

// Overlay types
export const Fullscreen: Story = {
  args: {
    loadingText: 'Fullscreen loading',
    overlayType: 'fullscreen',
    show: true,
  },
}

export const Inline: Story = {
  args: {
    loadingText: 'Inline loading',
    overlayType: 'inline',
    show: true,
  },
}

export const Overlay: Story = {
  args: {
    loadingText: 'Overlay loading',
    overlayType: 'overlay',
    show: true,
  },
}

// Animation duration
export const SlowAnimation: Story = {
  args: {
    animationDuration: '2s',
    loadingText: 'Slow animation',
    show: true,
  },
}

export const FastAnimation: Story = {
  args: {
    animationDuration: '200ms',
    loadingText: 'Fast animation',
    show: true,
  },
}

// States
export const Hidden: Story = {
  args: {
    loadingText: 'Hidden loading',
    show: false,
  },
}

export const Entering: Story = {
  args: {
    loadingText: 'Entering state',
    show: true,
  },
}

export const Exiting: Story = {
  args: {
    loadingText: 'Exiting state',
    show: false,
  },
}

// Complex examples
export const WithLongText: Story = {
  args: {
    loadingText:
      'This is a very long loading message that demonstrates how the component handles longer text content',
    show: true,
  },
}

export const MultipleLoadingStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of different loading states and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          height: '200px',
          position: 'relative',
        }}
      >
        <h3 style={{ margin: '20px' }}>Fullscreen Loading</h3>
        <LoadingOverlay loadingText="Fullscreen loading" overlayType="fullscreen" show={true} />
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          height: '150px',
          position: 'relative',
        }}
      >
        <h3 style={{ margin: '20px' }}>Inline Loading</h3>
        <LoadingOverlay loadingText="Inline loading" overlayType="inline" show={true} />
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          height: '150px',
          position: 'relative',
        }}
      >
        <h3 style={{ margin: '20px' }}>Overlay Loading</h3>
        <LoadingOverlay loadingText="Overlay loading" overlayType="overlay" show={true} />
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          height: '150px',
          position: 'relative',
        }}
      >
        <h3 style={{ margin: '20px' }}>Fast Animation</h3>
        <LoadingOverlay
          animationDuration="300ms"
          loadingText="Fast animation"
          overlayType="inline"
          show={true}
        />
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          height: '150px',
          position: 'relative',
        }}
      >
        <h3 style={{ margin: '20px' }}>Slow Animation</h3>
        <LoadingOverlay
          animationDuration="1.5s"
          loadingText="Slow animation"
          overlayType="inline"
          show={true}
        />
      </div>
    </div>
  ),
}
