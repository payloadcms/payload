import type { I18nClient } from '@payloadcms/translations'
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { ErrorPill } from '../elements/ErrorPill/index.js'

// Global styles are imported in .storybook/preview.ts

// Mock i18n object for Storybook
const mockI18n: I18nClient = {
  dateFNS: {} as I18nClient['dateFNS'], // Mock dateFNS locale
  dateFNSKey: 'en' as I18nClient['dateFNSKey'], // Mock dateFNS key
  fallbackLanguage: 'en',
  language: 'en',
  t: (key: string) => {
    const translations: Record<string, string> = {
      'general:error': 'error',
      'general:errors': 'errors',
    }
    return translations[key] || key
  },
  translations: {} as I18nClient['translations'], // Mock translations object
}

const meta: Meta<typeof ErrorPill> = {
  args: {
    count: 1,
    i18n: mockI18n,
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
    i18n: mockI18n,
  },
}

export const MultipleErrors: Story = {
  args: {
    count: 5,
    i18n: mockI18n,
  },
}

export const WithMessage: Story = {
  args: {
    count: 1,
    i18n: mockI18n,
    withMessage: true,
  },
}

export const ThreeErrorsWithMessage: Story = {
  args: {
    count: 3,
    i18n: mockI18n,
    withMessage: true,
  },
}

// Count variations
export const SingleDigit: Story = {
  args: {
    count: 7,
    i18n: mockI18n,
  },
}

export const DoubleDigit: Story = {
  args: {
    count: 42,
    i18n: mockI18n,
  },
}

export const TripleDigit: Story = {
  args: {
    count: 999,
    i18n: mockI18n,
  },
}

export const LargeNumber: Story = {
  args: {
    count: 1234,
    i18n: mockI18n,
  },
}

// Edge cases
export const ZeroErrors: Story = {
  args: {
    count: 0,
    i18n: mockI18n,
  },
}

export const OneError: Story = {
  args: {
    count: 1,
    i18n: mockI18n,
  },
}

export const TwoErrors: Story = {
  args: {
    count: 2,
    i18n: mockI18n,
  },
}

export const NinetyNineErrors: Story = {
  args: {
    count: 99,
    i18n: mockI18n,
  },
}

export const OneHundredErrors: Story = {
  args: {
    count: 100,
    i18n: mockI18n,
  },
}

// With custom className
export const WithCustomClassName: Story = {
  args: {
    className: 'custom-error-pill',
    count: 5,
    i18n: mockI18n,
  },
}

// Different message states
export const SingleErrorWithMessage: Story = {
  args: {
    count: 1,
    i18n: mockI18n,
    withMessage: true,
  },
}

export const FiveErrorsWithMessage: Story = {
  args: {
    count: 5,
    i18n: mockI18n,
    withMessage: true,
  },
}
