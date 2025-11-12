import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Button } from '../../packages/ui/src/elements/Button'
import { CheckboxInput } from '../../packages/ui/src/fields/Checkbox/Input'
import { SelectInput } from '../../packages/ui/src/fields/Select/Input'
import { TextInput } from '../../packages/ui/src/fields/Text/Input'
import { TextareaInput } from '../../packages/ui/src/fields/Textarea/Input'
import { PayloadMockProviders } from '../_mocks/MockProviders'

const meta = {
  parameters: {
    docs: {
      description: {
        component:
          'Reference example showing proper Payload component styling. Components use actual Payload UI components wrapped in PayloadMockProviders, relying entirely on Payload SCSS with no inline styles.',
      },
    },
    layout: 'centered',
  },
  title: 'Overview/Proper Styling Reference',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * This example demonstrates the proper way to use Payload components in Storybook:
 *
 * 1. Wrap everything in PayloadMockProviders
 * 2. Use actual Payload UI components (TextInput, SelectInput, etc.) instead of plain HTML elements
 * 3. Let the imported SCSS handle all styling via CSS variables
 * 4. No inline styles or hardcoded colors
 * 5. Components automatically respect theme switching (light/dark)
 *
 * Key principles:
 * - CSS variables like --theme-elevation-150, --theme-bg handle colors
 * - Components use proper class structure (.field-type.text, etc.)
 * - SCSS mixins (@mixin formInput) provide hover, focus, disabled states
 * - All styling comes from packages/ui/src/scss loaded in .storybook/preview.ts
 */
export const ProperlyStyledComponents: Story = {
  render: () => {
    const [textValue, setTextValue] = useState('')
    const [textareaValue, setTextareaValue] = useState('')
    const [selectValue, setSelectValue] = useState('')
    const [checkbox, setCheckbox] = useState(false)
    const [showErrors, setShowErrors] = useState(false)

    return (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '24px' }}>
          <h2 style={{ marginBottom: '24px' }}>Properly Styled Payload Components</h2>

          {/* Text Input - Normal State */}
          <div style={{ marginBottom: '24px' }}>
            <TextInput
              description="As it appears on official documents"
              label="Full Name"
              onChange={(e) => setTextValue(e.target.value)}
              path="fullName"
              placeholder="Enter your full name"
              required={true}
              showError={false}
              value={textValue}
            />
          </div>

          {/* Text Input - Error State */}
          <div style={{ marginBottom: '24px' }}>
            <TextInput
              label="Email Address"
              onChange={() => {}}
              path="email"
              placeholder="email@example.com"
              required={true}
              showError={showErrors}
              value=""
            />
          </div>

          {/* Textarea Input */}
          <div style={{ marginBottom: '24px' }}>
            <TextareaInput
              description="A brief description for your profile"
              label="Bio"
              onChange={(e) => setTextareaValue(e.target.value)}
              path="bio"
              placeholder="Tell us about yourself"
              rows={4}
              value={textareaValue}
            />
          </div>

          {/* Select Input */}
          <div style={{ marginBottom: '24px' }}>
            <SelectInput
              label="Country"
              onChange={setSelectValue}
              options={[
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
                { label: 'United Kingdom', value: 'uk' },
                { label: 'Australia', value: 'au' },
              ]}
              path="country"
              required={true}
              value={selectValue}
            />
          </div>

          {/* Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <CheckboxInput
              checked={checkbox}
              label="I agree to the terms and conditions"
              onToggle={(e) => setCheckbox(e.target.checked)}
              required={true}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button buttonStyle="secondary" onClick={() => setShowErrors(!showErrors)}>
              {showErrors ? 'Hide' : 'Show'} Errors
            </Button>
            <Button buttonStyle="primary" disabled={!textValue || !checkbox}>
              Submit Form
            </Button>
          </div>

          {/* Info Box */}
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-50)',
              borderRadius: '4px',
              marginTop: '32px',
              padding: '16px',
            }}
          >
            <h4 style={{ marginTop: 0 }}>Styling Notes</h4>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>All colors use CSS variables (--theme-elevation-*, --theme-bg, etc.)</li>
              <li>Hover, focus, and error states are automatic</li>
              <li>Dark mode works via theme switcher</li>
              <li>No inline styles on form components</li>
              <li>Matches Payload admin panel exactly</li>
            </ul>
          </div>
        </div>
      </PayloadMockProviders>
    )
  },
}

/**
 * Read-only components example showing disabled/readonly states
 */
export const ReadOnlyComponents: Story = {
  render: () => {
    return (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '24px' }}>
          <h2 style={{ marginBottom: '24px' }}>Read-Only Components</h2>

          <div style={{ marginBottom: '24px' }}>
            <TextInput
              description="Username cannot be changed"
              label="Username"
              onChange={() => {}}
              path="username"
              readOnly={true}
              value="john.doe"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <SelectInput
              label="Account Type"
              onChange={() => {}}
              options={[
                { label: 'Free', value: 'free' },
                { label: 'Premium', value: 'premium' },
                { label: 'Enterprise', value: 'enterprise' },
              ]}
              path="accountType"
              readOnly={true}
              value="premium"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <CheckboxInput
              checked={true}
              label="Email notifications enabled"
              onToggle={() => {}}
              readOnly={true}
            />
          </div>
        </div>
      </PayloadMockProviders>
    )
  },
}
