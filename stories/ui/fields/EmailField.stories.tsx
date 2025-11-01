import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import the actual Payload Email field styles
import '../../../packages/ui/src/fields/Email/index.scss'

interface EmailFieldProps {
  admin?: {
    description?: string
    disabled?: boolean
    placeholder?: string
  }
  defaultValue?: string
  label: string
  name: string
  onChange?: (value: string) => void
  path: string
  required?: boolean
  value?: string
}

const EmailField: React.FC<EmailFieldProps> = ({
  name,
  admin = {},
  defaultValue,
  label,
  onChange,
  required,
  value = '',
}) => {
  const { description, disabled, placeholder } = admin
  const [emailValue, setEmailValue] = React.useState(value || defaultValue || '')
  const [error, setError] = React.useState('')

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setError(required ? 'Email is required' : '')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
    } else {
      setError('')
    }
  }

  const handleChange = (newValue: string) => {
    setEmailValue(newValue)
    validateEmail(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  React.useEffect(() => {
    validateEmail(emailValue)
  }, [emailValue, required])

  return (
    <div className={`${fieldBaseClass} email${error ? ' error' : ''}`}>
      <FieldLabel label={label} required={required} />
      {description && <FieldDescription description={description} />}
      <input
        disabled={disabled}
        name={name}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || 'Enter email address...'}
        type="email"
        value={emailValue}
      />
      {error && <FieldError message={error} />}
    </div>
  )
}

const meta = {
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the field',
    },
    admin: {
      control: 'object',
      description: 'Admin configuration',
    },
    label: {
      control: 'text',
      description: 'Label for the email field',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  component: EmailField,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '20px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'EmailField provides email input with built-in format validation and accessibility features.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/EmailField',
} satisfies Meta<typeof EmailField>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'email',
    label: 'Email Address',
    path: 'email',
    required: false,
  },
}

export const WithPlaceholder: Story = {
  args: {
    name: 'userEmail',
    admin: {
      placeholder: 'Enter your email address...',
    },
    label: 'Your Email',
    path: 'userEmail',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'requiredEmail',
    admin: {
      placeholder: 'user@example.com',
    },
    label: 'Email Address',
    path: 'requiredEmail',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'contactEmail',
    admin: {
      description:
        'This email will be used for important account notifications and password recovery.',
      placeholder: 'your.email@company.com',
    },
    label: 'Contact Email',
    path: 'contactEmail',
    required: true,
  },
}

export const WithDefaultValue: Story = {
  args: {
    name: 'defaultEmail',
    admin: {
      placeholder: 'Enter your email...',
    },
    defaultValue: 'user@example.com',
    label: 'Email Address',
    path: 'defaultEmail',
    required: false,
  },
}

export const Interactive: Story = {
  render: () => {
    const [email, setEmail] = React.useState('')
    const [validationMessage, setValidationMessage] = React.useState('')

    const validateEmail = (value: string) => {
      if (!value) {
        setValidationMessage('')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setValidationMessage('Please enter a valid email address')
      } else {
        setValidationMessage('✅ Valid email address')
      }
    }

    React.useEffect(() => {
      validateEmail(email)
    }, [email])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive Email Validation</h3>
          <p>Type in the email field below to see real-time validation feedback.</p>
        </div>

        <EmailField
          admin={{
            description: 'This field validates email format as you type.',
            placeholder: 'try typing: user@domain.com',
          }}
          label="Email Address"
          name="interactiveEmail"
          onChange={(value) => setEmail(value || '')}
          path="interactiveEmail"
          required={true}
          value={email}
        />

        {validationMessage && (
          <div
            style={{
              backgroundColor: validationMessage.includes('✅') ? '#f0f9ff' : '#fef2f2',
              border: `1px solid ${validationMessage.includes('✅') ? '#bae6fd' : '#fecaca'}`,
              borderRadius: '6px',
              color: validationMessage.includes('✅') ? '#0369a1' : '#dc2626',
              fontSize: '14px',
              padding: '12px',
            }}
          >
            {validationMessage}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            fontSize: '14px',
            padding: '12px',
          }}
        >
          <strong>Current value:</strong> <code>{email || '(empty)'}</code>
        </div>
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>Email Field Validation States</h3>

      <div>
        <h4>Valid Email</h4>
        <EmailField
          admin={{
            placeholder: 'user@example.com',
          }}
          label="Valid Email Address"
          name="validEmail"
          path="validEmail"
          required={false}
          value="user@example.com"
        />
      </div>

      <div>
        <h4>Invalid Email Format</h4>
        <EmailField
          admin={{
            placeholder: 'user@example.com',
          }}
          label="Invalid Email Address"
          name="invalidEmail"
          path="invalidEmail"
          required={false}
          value="not-an-email"
        />
      </div>

      <div>
        <h4>Required but Empty</h4>
        <EmailField
          admin={{
            description: 'This field is required but currently empty.',
            placeholder: 'Required email address...',
          }}
          label="Required Email"
          name="requiredEmpty"
          path="requiredEmpty"
          required={true}
          value=""
        />
      </div>

      <div>
        <h4>Long Email Address</h4>
        <EmailField
          label="Very Long Email Address"
          name="longEmail"
          path="longEmail"
          required={false}
          value="very.long.email.address.with.many.parts@very-long-domain-name-example.com"
        />
      </div>
    </div>
  ),
}

export const CommonEmailExamples: Story = {
  render: () => {
    const commonEmails = [
      'user@gmail.com',
      'john.doe@company.co.uk',
      'admin+test@example.org',
      'support@my-startup.io',
      'contact@subdomain.example.com',
      'newsletter@marketing-team.biz',
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>Common Email Format Examples</h3>
        <p>These examples show various valid email formats that the EmailField accepts:</p>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
          {commonEmails.map((email, index) => (
            <EmailField
              key={index}
              label={`Example ${index + 1}`}
              name={`example${index + 1}`}
              path={`example${index + 1}`}
              required={false}
              value={email}
            />
          ))}
        </div>
      </div>
    )
  },
}

export const RealWorldExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h3>Real-world Email Field Examples</h3>

      <div>
        <h4>User Registration</h4>
        <EmailField
          admin={{
            description:
              "We'll use this email to send you account confirmation and important updates.",
            placeholder: 'Enter your email address',
          }}
          label="Email Address"
          name="registrationEmail"
          path="registrationEmail"
          required={true}
        />
      </div>

      <div>
        <h4>Newsletter Subscription</h4>
        <EmailField
          admin={{
            description: 'Subscribe to our weekly newsletter for the latest updates and insights.',
            placeholder: 'your.email@example.com',
          }}
          label="Subscribe to Newsletter"
          name="newsletterEmail"
          path="newsletterEmail"
          required={false}
        />
      </div>

      <div>
        <h4>Contact Information</h4>
        <EmailField
          admin={{
            description: 'Primary contact email for this account. Used for billing and support.',
            placeholder: 'billing@company.com',
          }}
          label="Billing Email"
          name="billingEmail"
          path="billingEmail"
          required={true}
        />
      </div>

      <div>
        <h4>Team Member Invitation</h4>
        <EmailField
          admin={{
            description: 'Enter the email address of the person you want to invite to your team.',
            placeholder: 'teammate@company.com',
          }}
          label="Invite Team Member"
          name="inviteEmail"
          path="inviteEmail"
          required={true}
        />
      </div>

      <div>
        <h4>Support Contact</h4>
        <EmailField
          admin={{
            description:
              "If you need help, we'll send updates about your support ticket to this email.",
            placeholder: 'your-support-email@example.com',
          }}
          label="Support Email"
          name="supportEmail"
          path="supportEmail"
          required={false}
        />
      </div>

      <div>
        <h4>Notification Settings</h4>
        <EmailField
          admin={{
            description:
              'Email address for system notifications and alerts. Leave blank to use your primary email.',
            placeholder: 'notifications@your-domain.com (optional)',
          }}
          label="Notification Email"
          name="notificationEmail"
          path="notificationEmail"
          required={false}
        />
      </div>
    </div>
  ),
}
