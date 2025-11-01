import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { CheckboxInput } from '../../../packages/ui/src/fields/Checkbox/Input'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Fields/Field Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Basic field components used throughout Payload CMS forms - labels, errors, descriptions, and simple inputs.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '500px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
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
        <FieldLabel 
          label="Content" 
          localized={true} 
          hideLocale={false}
        />
      </div>
      
      <div>
        <h4>Label with Custom Element</h4>
        <FieldLabel label="Description" as="span" />
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
            "Password must be at least 8 characters long",
            "Password must contain at least one uppercase letter",
            "Password must contain at least one number"
          ]} 
        />
      </div>
      
      <div>
        <h4>Error with Custom Styling</h4>
        <div style={{ padding: '12px', backgroundColor: '#fff5f5', borderRadius: '4px', border: '1px solid #fed7d7' }}>
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
            en: "This content will be displayed on the public website.",
            es: "Este contenido se mostrará en el sitio web público."
          }}
        />
      </div>
      
      <div>
        <h4>HTML Description</h4>
        <FieldDescription 
          description="Supports <strong>HTML formatting</strong> and <a href='#'>links</a>." 
        />
      </div>
    </div>
  ),
}

// Checkbox Input examples
export const CheckboxInputs: Story = {
  render: () => {
    const [checkboxStates, setCheckboxStates] = useState({
      basic: false,
      required: false,
      partial: false,
      disabled: false,
    })
    
    const handleToggle = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCheckboxStates(prev => ({
        ...prev,
        [key]: event.target.checked
      }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Checkbox Inputs</h3>
        
        <div>
          <h4>Basic Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.basic}
            onToggle={handleToggle('basic')}
            label="Enable notifications"
          />
        </div>
        
        <div>
          <h4>Required Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.required}
            onToggle={handleToggle('required')}
            label="I agree to the terms and conditions"
            required={true}
          />
        </div>
        
        <div>
          <h4>Partial Checkbox</h4>
          <CheckboxInput
            checked={checkboxStates.partial}
            onToggle={handleToggle('partial')}
            label="Select all items"
            partialChecked={true}
          />
        </div>
        
        <div>
          <h4>Read-only Checkbox</h4>
          <CheckboxInput
            checked={true}
            onToggle={() => {}} // No-op for read-only
            label="This setting is read-only"
            readOnly={true}
          />
        </div>
        
        <div>
          <h4>Custom Label Component</h4>
          <CheckboxInput
            checked={checkboxStates.disabled}
            onToggle={handleToggle('disabled')}
            Label={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Custom label with</span>
                <code style={{ backgroundColor: '#f1f1f1', padding: '2px 6px', borderRadius: '3px' }}>
                  code
                </code>
              </div>
            }
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
    const [emailError, setEmailError] = useState<string | null>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    
    const validateEmail = (value: string) => {
      if (!value) {
        setEmailError('Email is required')
      } else if (!/\S+@\S+\.\S+/.test(value)) {
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
          <FieldLabel 
            label="Email Address" 
            required={true}
            htmlFor="email-input"
          />
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              validateEmail(e.target.value)
            }}
            style={{
              padding: '8px 12px',
              border: emailError ? '1px solid #e53e3e' : '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
            }}
            placeholder="Enter your email address"
          />
          <FieldDescription description="We'll use this to send you important updates about your account." />
          {emailError && <FieldError message={emailError} />}
        </div>
        
        {/* Terms Checkbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <CheckboxInput
            checked={agreedToTerms}
            onToggle={(e) => setAgreedToTerms(e.target.checked)}
            label="I agree to the Terms of Service and Privacy Policy"
            required={true}
          />
          {!agreedToTerms && (
            <FieldDescription description="You must agree to continue with registration." />
          )}
        </div>
        
        {/* Submit Button */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="submit"
            disabled={!email || emailError !== null || !agreedToTerms}
            style={{
              padding: '10px 20px',
              backgroundColor: (!email || emailError !== null || !agreedToTerms) ? '#a0aec0' : '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: (!email || emailError !== null || !agreedToTerms) ? 'not-allowed' : 'pointer',
            }}
          >
            Create Account
          </button>
        </div>
        
        {/* Debug Info - Collapsible */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{ 
            cursor: 'pointer',
            padding: '8px 0',
            fontSize: '14px',
            color: '#666',
            userSelect: 'none'
          }}>
            🔍 Show Debug Info
          </summary>
          <div style={{ 
            marginTop: '8px',
            padding: '12px', 
            backgroundColor: '#f7fafc', 
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #e2e8f0'
          }}>
            <strong>Debug Info:</strong><br />
            Email: "{email}"<br />
            Email Error: {emailError || 'none'}<br />
            Agreed to Terms: {agreedToTerms.toString()}<br />
            Form Valid: {(!email || emailError !== null || !agreedToTerms) ? 'false' : 'true'}
          </div>
        </details>
      </div>
    )
  },
}