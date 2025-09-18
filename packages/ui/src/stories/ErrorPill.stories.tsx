import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { ErrorPill } from '../elements/ErrorPill/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof ErrorPill> = {
  args: {
    count: 1,
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    count: {
      control: { type: 'number', max: 1000, min: 0 },
      description: 'Number of errors to display',
    },
    i18n: {
      control: false,
      description: 'Internationalization object for translations',
    },
    withMessage: {
      control: 'boolean',
      description: 'Whether to show error message text',
    },
  },
  component: ErrorPill,
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
        component: 'An error pill component that displays error counts with optional messages.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/ErrorPill',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    count: 1,
  },
}

export const MultipleErrors: Story = {
  args: {
    count: 5,
  },
}

export const WithMessage: Story = {
  args: {
    count: 1,
    withMessage: true,
  },
}

export const ThreeErrorsWithMessage: Story = {
  args: {
    count: 3,
    withMessage: true,
  },
}

// Count variations
export const SingleDigit: Story = {
  args: {
    count: 7,
  },
}

export const DoubleDigit: Story = {
  args: {
    count: 42,
  },
}

export const TripleDigit: Story = {
  args: {
    count: 999,
  },
}

export const LargeNumber: Story = {
  args: {
    count: 1234,
  },
}

// Edge cases
export const ZeroErrors: Story = {
  args: {
    count: 0,
  },
}

export const OneError: Story = {
  args: {
    count: 1,
  },
}

export const TwoErrors: Story = {
  args: {
    count: 2,
  },
}

export const NinetyNineErrors: Story = {
  args: {
    count: 99,
  },
}

export const OneHundredErrors: Story = {
  args: {
    count: 100,
  },
}

// With custom className
export const WithCustomClassName: Story = {
  args: {
    className: 'custom-error-pill',
    count: 5,
  },
}

// Different message states
export const SingleErrorWithMessage: Story = {
  args: {
    count: 1,
    withMessage: true,
  },
}

export const FiveErrorsWithMessage: Story = {
  args: {
    count: 5,
    withMessage: true,
  },
}
