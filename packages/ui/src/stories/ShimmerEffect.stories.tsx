import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { ShimmerEffect, StaggeredShimmers } from '../elements/ShimmerEffect/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof ShimmerEffect> = {
  args: {
    height: '60px',
    width: '100%',
  },
  argTypes: {
    animationDelay: {
      control: 'text',
      description: 'Delay before the shimmer animation starts',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    disableInlineStyles: {
      control: 'boolean',
      description: 'Whether to disable inline styles for height and width',
    },
    height: {
      control: 'text',
      description: 'Height of the shimmer effect',
    },
    width: {
      control: 'text',
      description: 'Width of the shimmer effect',
    },
  },
  component: ShimmerEffect,
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
        component: 'A shimmer effect component used for loading states and skeleton screens.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/ShimmerEffect',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    height: '60px',
    width: '200px',
  },
}

export const Wide: Story = {
  args: {
    height: '40px',
    width: '400px',
  },
}

export const Tall: Story = {
  args: {
    height: '120px',
    width: '200px',
  },
}

export const Square: Story = {
  args: {
    height: '100px',
    width: '100px',
  },
}

// Different sizes
export const Small: Story = {
  args: {
    height: '20px',
    width: '150px',
  },
}

export const Medium: Story = {
  args: {
    height: '60px',
    width: '300px',
  },
}

export const Large: Story = {
  args: {
    height: '100px',
    width: '500px',
  },
}

// Animation delays
export const WithDelay: Story = {
  args: {
    animationDelay: '500ms',
    height: '60px',
    width: '200px',
  },
}

export const WithLongDelay: Story = {
  args: {
    animationDelay: '1s',
    height: '60px',
    width: '200px',
  },
}

// Custom styling
export const WithCustomClassName: Story = {
  args: {
    className: 'custom-shimmer',
    height: '60px',
    width: '200px',
  },
}

export const DisableInlineStyles: Story = {
  args: {
    disableInlineStyles: true,
    height: '60px',
    width: '200px',
  },
}

// Numeric dimensions
export const NumericDimensions: Story = {
  args: {
    height: 80,
    width: 250,
  },
}

// Mixed dimensions
export const MixedDimensions: Story = {
  args: {
    height: '60px',
    width: 300,
  },
}

// StaggeredShimmers component
export const StaggeredShimmersBasic: Story = {
  args: {
    count: 3,
    height: '60px',
    width: '100%',
  },
  component: StaggeredShimmers,
}

export const StaggeredShimmersMany: Story = {
  args: {
    count: 5,
    height: '40px',
    width: '100%',
  },
  component: StaggeredShimmers,
}

export const StaggeredShimmersWithDelay: Story = {
  args: {
    count: 4,
    height: '50px',
    shimmerDelay: '100ms',
    width: '100%',
  },
  component: StaggeredShimmers,
}

export const StaggeredShimmersWithRenderDelay: Story = {
  args: {
    count: 3,
    height: '60px',
    renderDelay: 1000,
    width: '100%',
  },
  component: StaggeredShimmers,
}

// Real-world examples
export const CardSkeleton: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A card skeleton loading state using shimmer effects.',
      },
    },
  },
  render: () => (
    <div
      style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', width: '300px' }}
    >
      <ShimmerEffect height="20px" width="60%" />
      <div style={{ margin: '12px 0' }}>
        <ShimmerEffect height="16px" width="100%" />
        <ShimmerEffect height="16px" width="80%" />
        <ShimmerEffect height="16px" width="90%" />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <ShimmerEffect height="32px" width="80px" />
        <ShimmerEffect height="32px" width="60px" />
      </div>
    </div>
  ),
}

export const ListSkeleton: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A list skeleton loading state using staggered shimmers.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <StaggeredShimmers
        count={5}
        height="60px"
        shimmerDelay="50ms"
        shimmerItemClassName="list-item-shimmer"
        width="100%"
      />
    </div>
  ),
}

export const TableSkeleton: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A table skeleton loading state using shimmer effects.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '600px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <ShimmerEffect height="20px" width="120px" />
        <ShimmerEffect height="20px" width="100px" />
        <ShimmerEffect height="20px" width="80px" />
        <ShimmerEffect height="20px" width="90px" />
      </div>

      {/* Rows */}
      <StaggeredShimmers
        count={4}
        height="40px"
        shimmerDelay="75ms"
        shimmerItemClassName="table-row-shimmer"
        width="100%"
      />
    </div>
  ),
}

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available shimmer effect variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Basic shimmers */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Basic Shimmer Effects</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <ShimmerEffect height="20px" width="100px" />
          <ShimmerEffect height="40px" width="150px" />
          <ShimmerEffect height="60px" width="200px" />
          <ShimmerEffect height="80px" width="250px" />
        </div>
      </div>

      {/* Different shapes */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Different Shapes</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <ShimmerEffect height="20px" width="200px" />
          <ShimmerEffect height="40px" width="200px" />
          <ShimmerEffect height="60px" width="200px" />
          <ShimmerEffect height="100px" width="100px" />
        </div>
      </div>

      {/* With delays */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>With Animation Delays</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <ShimmerEffect animationDelay="0ms" height="40px" width="150px" />
          <ShimmerEffect animationDelay="200ms" height="40px" width="150px" />
          <ShimmerEffect animationDelay="400ms" height="40px" width="150px" />
          <ShimmerEffect animationDelay="600ms" height="40px" width="150px" />
        </div>
      </div>

      {/* Staggered shimmers */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Staggered Shimmers</h3>
        <StaggeredShimmers count={4} height="40px" shimmerDelay="100ms" width="100%" />
      </div>
    </div>
  ),
}
