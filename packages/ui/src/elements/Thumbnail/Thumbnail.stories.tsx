/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Thumbnail } from './index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Thumbnail> = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=1',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    collectionSlug: {
      control: 'text',
      description: 'Collection slug for the file',
    },
    doc: {
      control: 'object',
      description: 'Document data containing file information',
    },
    fileSrc: {
      control: 'text',
      description: 'Source URL of the image file',
    },
    imageCacheTag: {
      control: 'text',
      description: 'Cache tag to append to the image URL',
    },
    size: {
      control: 'select',
      description: 'Size variant of the thumbnail',
      options: ['small', 'medium', 'large', 'expand'],
    },
    uploadConfig: {
      control: 'object',
      description: 'Upload configuration for the collection',
    },
  },
  component: Thumbnail,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A thumbnail component that displays images with loading states and fallbacks.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Thumbnail',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=1',
  },
}

export const WithFilename: Story = {
  args: {
    doc: { filename: 'sample-image.jpg' },
    fileSrc: 'https://picsum.photos/200/200?random=2',
  },
}

export const WithCacheTag: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=3',
    imageCacheTag: 'v1.2.3',
  },
}

// Sizes
export const Small: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=4',
    size: 'small',
  },
}

export const Medium: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=5',
    size: 'medium',
  },
}

export const Large: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=6',
    size: 'large',
  },
}

export const Expand: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=7',
    size: 'expand',
  },
}

// Error states
export const BrokenImage: Story = {
  args: {
    fileSrc: 'https://broken-url-that-does-not-exist.com/image.jpg',
  },
}

export const NoImage: Story = {
  args: {
    fileSrc: undefined,
  },
}

// Different image types
export const Portrait: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/300?random=8',
  },
}

export const Landscape: Story = {
  args: {
    fileSrc: 'https://picsum.photos/300/200?random=9',
  },
}

export const Square: Story = {
  args: {
    fileSrc: 'https://picsum.photos/200/200?random=10',
  },
}

// With custom className
export const WithCustomClassName: Story = {
  args: {
    className: 'custom-thumbnail',
    fileSrc: 'https://picsum.photos/200/200?random=11',
  },
}

// Grid showcase
export const AllSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available thumbnail sizes.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Small</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/200?random=14" size="small" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Medium</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/200?random=15" size="medium" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Large</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/200?random=16" size="large" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Expand</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/200?random=17" size="expand" />
      </div>
    </div>
  ),
}

export const DifferentAspectRatios: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of thumbnails with different aspect ratios.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Portrait (2:3)</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/300?random=18" size="medium" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Square (1:1)</h4>
        <Thumbnail fileSrc="https://picsum.photos/200/200?random=19" size="medium" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Landscape (3:2)</h4>
        <Thumbnail fileSrc="https://picsum.photos/300/200?random=20" size="medium" />
      </div>
    </div>
  ),
}

export const LoadingAndErrorStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of loading and error states.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Loading State</h4>
        <Thumbnail fileSrc="https://slow-loading-image.com/image.jpg" size="medium" />
        <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
          (Shows shimmer effect while loading)
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Error State</h4>
        <Thumbnail fileSrc="https://broken-url.com/image.jpg" size="medium" />
        <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
          (Shows file icon when image fails to load)
        </p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>No Source</h4>
        <Thumbnail fileSrc={undefined} size="medium" />
        <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
          (Shows file icon when no source provided)
        </p>
      </div>
    </div>
  ),
}
