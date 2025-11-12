import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { CheckboxInput } from '../../../packages/ui/src/fields/Checkbox/Input'
import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '500px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Basic field components used throughout Payload CMS forms - labels, errors, descriptions, and simple inputs.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Fields/Field Components',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Field Label examples
export const FieldLabels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Field Labels</h3>

      <div>
        <h4>Basic Label</h4>
        <FieldLabel label="Page Title" />
      </div>

      <div>
        <h4>Required Label</h4>
        <FieldLabel label="Email Address" required={true} />
      </div>

      <div>
        <h4>Localized Label</h4>
        <FieldLabel hideLocale={false} label="Content" localized={true} />
      </div>

      <div>
        <h4>Label with Custom Element</h4>
        <FieldLabel as="span" label="Description" />
      </div>

      <div>
        <h4>Unstyled Label</h4>
        <FieldLabel label="Unstyled Label" unstyled={true} />
      </div>
    </div>
  ),
}

// Field Error examples
export const FieldErrors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Field Errors</h3>

      <div>
        <h4>Validation Error</h4>
        <FieldError message="This field is required" />
      </div>

      <div>
        <h4>Multiple Errors</h4>
        <FieldError
          message={[
            'Password must be at least 8 characters long',
            'Password must contain at least one uppercase letter',
            'Password must contain at least one number',
          ]}
        />
      </div>

      <div>
        <h4>Error with Custom Styling</h4>
        <div
          style={{
            backgroundColor: 'var(--theme-error-50)',
            border: '1px solid var(--theme-error-200)',
            borderRadius: '4px',
            padding: '12px',
          }}
        >
          <FieldError message="Invalid email format" />
        </div>
      </div>
    </div>
  ),
}

// Field Description examples
export const FieldDescriptions: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Field Descriptions</h3>

      <div>
        <h4>Simple Description</h4>
        <FieldDescription description="Enter your full name as it appears on official documents." />
      </div>

      <div>
        <h4>Rich Description</h4>
        <FieldDescription
          description={{
            en: 'This content will be displayed on the public website.',
            es: 'Este contenido se mostrará en el sitio web público.',
          }}
        />
      </div>

      <div>
        <h4>HTML Description</h4>
        <FieldDescription description="Supports <strong>HTML formatting</strong> and <a href='#'>links</a>." />
      </div>
    </div>
  ),
}

// Checkbox Input examples
export const CheckboxInputs: Story = {
  render: () => {
    const [checkboxStates, setCheckboxStates] = useState({
      basic: false,
      disabled: false,
      partial: false,
      required: false,
    })

    const handleToggle = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCheckboxStates((prev) => ({
        ...prev,
        [key]: event.target.checked,
      }))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Checkbox Inputs</h3>

        <div>
          <h4>Basic Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.basic}
            label="Enable notifications"
            onToggle={handleToggle('basic')}
          />
        </div>

        <div>
          <h4>Required Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.required}
            label="I agree to the terms and conditions"
            onToggle={handleToggle('required')}
            required={true}
          />
        </div>

        <div>
          <h4>Partial Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.partial}
            label="Select all items"
            onToggle={handleToggle('partial')}
            partialChecked={true}
          />
        </div>

        <div>
          <h4>Read-only Checkbox</h4>
          <CheckboxInput
            checked={true}
            label="This setting is read-only"
            onToggle={() => {}} // No-op for read-only
            readOnly={true}
          />
        </div>

        <div>
          <h4>Custom Label Component</h4>
          <CheckboxInput
            checked={checkboxStates.disabled}
            Label={
              <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
                <span>Custom label with</span>
                <code
                  style={{
                    backgroundColor: 'var(--theme-elevation-50)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                  }}
                >
                  code
                </code>
              </div>
            }
            onToggle={handleToggle('disabled')}
          />
        </div>
      </div>
    )
  },
}

// Complete form field example
export const CompleteFieldExample: Story = {
  render: () => {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState<null | string>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const validateEmail = (value: string) => {
      if (!value) {
        setEmailError('Email is required')
      } else if (!/\S[^\s@]*@\S+\.\S+/.test(value)) {
        setEmailError('Please enter a valid email address')
      } else {
        setEmailError(null)
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Complete Field Examples</h3>

        {/* Email Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <FieldLabel htmlFor="email-input" label="Email Address" required={true} />
          <input
            id="email-input"
            onChange={(e) => {
              setEmail(e.target.value)
              validateEmail(e.target.value)
            }}
            placeholder="Enter your email address"
            style={{
              border: emailError
                ? '1px solid var(--theme-error-500)'
                : '1px solid var(--theme-elevation-150)',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
              padding: '8px 12px',
            }}
            type="email"
            value={email}
          />
          <FieldDescription description="We'll use this to send you important updates about your account." />
          {emailError && <FieldError message={emailError} />}
        </div>

        {/* Terms Checkbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <CheckboxInput
            checked={agreedToTerms}
            label="I agree to the Terms of Service and Privacy Policy"
            onToggle={(e) => setAgreedToTerms(e.target.checked)}
            required={true}
          />
          {!agreedToTerms && (
            <FieldDescription description="You must agree to continue with registration." />
          )}
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            disabled={!email || emailError !== null || !agreedToTerms}
            style={{
              backgroundColor:
                !email || emailError !== null || !agreedToTerms
                  ? 'var(--theme-elevation-400)'
                  : 'var(--theme-input-bg)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: !email || emailError !== null || !agreedToTerms ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              padding: '10px 20px',
            }}
            type="submit"
          >
            Create Account
          </button>
        </div>

        {/* Debug Info - Collapsible */}
        <details style={{ marginTop: '20px' }}>
          <summary
            style={{
              color: 'var(--theme-elevation-400)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '8px 0',
              userSelect: 'none',
            }}
          >
            🔍 Show Debug Info
          </summary>
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-50)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              marginTop: '8px',
              padding: '12px',
            }}
          >
            <strong>Debug Info:</strong>
            <br />
            Email: "{email}"<br />
            Email Error: {emailError || 'none'}
            <br />
            Agreed to Terms: {agreedToTerms.toString()}
            <br />
            Form Valid: {!email || emailError !== null || !agreedToTerms ? 'false' : 'true'}
          </div>
        </details>
      </div>
    )
  },
}
