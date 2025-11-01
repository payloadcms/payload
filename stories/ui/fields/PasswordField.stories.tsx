import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import the actual Payload Password field styles
import '../../../packages/ui/src/fields/Password/index.scss'

interface MockPasswordFieldProps {
  admin?: {
    autoComplete?: string
    description?: string
    disabled?: boolean
    placeholder?: string
  }
  label: string
  name: string
  onChange?: (value: string) => void
  path: string
  required?: boolean
  value?: string
}

const MockPasswordField: React.FC<MockPasswordFieldProps> = ({
  name,
  admin = {},
  label,
  onChange,
  required,
  value = '',
}) => {
  const { autoComplete, description, disabled, placeholder } = admin
  const [passwordValue, setPasswordValue] = React.useState(value)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleChange = (newValue: string) => {
    setPasswordValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'field-type',
        'password',
        required && !passwordValue && 'error',
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel label={label} required={required} />
      {description && <FieldDescription description={description} />}
      <div className={`${fieldBaseClass}__wrap`}>
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          name={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || 'Enter password...'}
          style={{ paddingRight: '40px' }}
          type={showPassword ? 'text' : 'password'}
          value={passwordValue}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          type="button"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {required && !passwordValue && <FieldError message="Password is required" />}
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
      description: 'Label for the password field',
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
  component: MockPasswordField,
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
          'MockPasswordField provides secure password input with show/hide toggle and validation features.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/MockPasswordField',
} satisfies Meta<typeof MockPasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'password',
    label: 'Password',
    path: 'password',
    required: false,
  },
}

export const WithPlaceholder: Story = {
  args: {
    name: 'userPassword',
    admin: {
      placeholder: 'Enter a secure password...',
    },
    label: 'Create Password',
    path: 'userPassword',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'requiredPassword',
    admin: {
      placeholder: 'Password is required',
    },
    label: 'Password',
    path: 'requiredPassword',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'securePassword',
    admin: {
      description:
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
      placeholder: 'Create a strong password...',
    },
    label: 'New Password',
    path: 'securePassword',
    required: true,
  },
}

export const AutoComplete: Story = {
  args: {
    name: 'loginPassword',
    admin: {
      autoComplete: 'current-password',
      placeholder: 'Enter your password',
    },
    label: 'Current Password',
    path: 'loginPassword',
    required: true,
  },
}

export const NewPassword: Story = {
  args: {
    name: 'newPassword',
    admin: {
      autoComplete: 'new-password',
      description: 'This password will replace your current one.',
      placeholder: 'Create new password',
    },
    label: 'New Password',
    path: 'newPassword',
    required: true,
  },
}

export const Interactive: Story = {
  render: () => {
    const [password, setPassword] = React.useState('')
    const [strength, setStrength] = React.useState({ feedback: '', score: 0 })

    const calculatePasswordStrength = (pwd: string) => {
      if (!pwd) {
        return { feedback: 'Enter a password', score: 0 }
      }

      let score = 0
      const feedback = []

      if (pwd.length >= 8) {
        score += 1
      } else {
        feedback.push('at least 8 characters')
      }

      if (/[a-z]/.test(pwd)) {
        score += 1
      } else {
        feedback.push('lowercase letter')
      }

      if (/[A-Z]/.test(pwd)) {
        score += 1
      } else {
        feedback.push('uppercase letter')
      }

      if (/\d/.test(pwd)) {
        score += 1
      } else {
        feedback.push('number')
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
        score += 1
      } else {
        feedback.push('special character')
      }

      const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
      const strengthColors = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a']

      return {
        color: strengthColors[score] || '#dc2626',
        feedback: feedback.length ? `Needs: ${feedback.join(', ')}` : 'Strong password!',
        label: strengthLabels[score] || 'Very Weak',
        score,
      }
    }

    React.useEffect(() => {
      setStrength(calculatePasswordStrength(password))
    }, [password])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive Password Strength</h3>
          <p>Type in the password field below to see real-time strength analysis.</p>
        </div>

        <MockPasswordField
          admin={{
            description: 'Password strength will be shown below as you type.',
            placeholder: 'Try: MySecure123!',
          }}
          label="Password"
          name="interactivePassword"
          onChange={(value) => setPassword(value || '')}
          path="interactivePassword"
          required={true}
          value={password}
        />

        {password && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <strong>Password Strength: </strong>
              <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
            </div>

            <div
              style={{
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                height: '8px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  backgroundColor: strength.color,
                  borderRadius: '4px',
                  height: '100%',
                  transition: 'width 0.3s ease',
                  width: `${(strength.score / 5) * 100}%`,
                }}
              />
            </div>

            <div style={{ color: '#6b7280', fontSize: '14px' }}>{strength.feedback}</div>
          </div>
        )}
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>Password Field Validation States</h3>

      <div>
        <h4>Valid Strong Password</h4>
        <MockPasswordField
          admin={{
            placeholder: 'Strong password example',
          }}
          label="Strong Password"
          name="strongPassword"
          path="strongPassword"
          required={false}
          value="MySecure123!"
        />
      </div>

      <div>
        <h4>Weak Password</h4>
        <MockPasswordField
          admin={{
            placeholder: 'Weak password example',
          }}
          label="Weak Password"
          name="weakPassword"
          path="weakPassword"
          required={false}
          value="123456"
        />
      </div>

      <div>
        <h4>Required but Empty</h4>
        <MockPasswordField
          admin={{
            description: 'This field is required but currently empty.',
            placeholder: 'Required password...',
          }}
          label="Required Password"
          name="requiredEmpty"
          path="requiredEmpty"
          required={true}
          value=""
        />
      </div>

      <div>
        <h4>Disabled State</h4>
        <MockPasswordField
          admin={{
            description: 'This password field is disabled.',
            disabled: true,
          }}
          label="Disabled Password"
          name="disabledPassword"
          path="disabledPassword"
          value="cannot-edit-this"
        />
      </div>
    </div>
  ),
}

export const RealWorldExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h3>Real-world Password Field Examples</h3>

      <div>
        <h4>User Registration</h4>
        <MockPasswordField
          admin={{
            autoComplete: 'new-password',
            description:
              'Choose a strong password to protect your account. Must be at least 8 characters.',
            placeholder: 'Create your password',
          }}
          label="Create Password"
          name="registrationPassword"
          path="registrationPassword"
          required={true}
        />
      </div>

      <div>
        <h4>Login Form</h4>
        <MockPasswordField
          admin={{
            autoComplete: 'current-password',
            placeholder: 'Enter your password',
          }}
          label="Password"
          name="loginPassword"
          path="loginPassword"
          required={true}
        />
      </div>

      <div>
        <h4>Password Change</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <MockPasswordField
            admin={{
              autoComplete: 'current-password',
              placeholder: 'Current password',
            }}
            label="Current Password"
            name="currentPassword"
            path="currentPassword"
            required={true}
          />
          <MockPasswordField
            admin={{
              autoComplete: 'new-password',
              description: 'New password must be different from your current password.',
              placeholder: 'New password',
            }}
            label="New Password"
            name="newPassword"
            path="newPassword"
            required={true}
          />
          <MockPasswordField
            admin={{
              autoComplete: 'new-password',
              placeholder: 'Confirm new password',
            }}
            label="Confirm New Password"
            name="confirmNewPassword"
            path="confirmNewPassword"
            required={true}
          />
        </div>
      </div>

      <div>
        <h4>Admin User Creation</h4>
        <MockPasswordField
          admin={{
            autoComplete: 'new-password',
            description:
              'Temporary password for the new admin user. They will be prompted to change it on first login.',
            placeholder: 'Temporary password',
          }}
          label="Temporary Password"
          name="tempAdminPassword"
          path="tempAdminPassword"
          required={true}
        />
      </div>

      <div>
        <h4>API Key Authentication</h4>
        <MockPasswordField
          admin={{
            description: 'Enter your API secret key. This will be encrypted and stored securely.',
            placeholder: 'API secret key',
          }}
          label="API Secret Key"
          name="apiSecret"
          path="apiSecret"
          required={true}
        />
      </div>

      <div>
        <h4>Database Connection</h4>
        <MockPasswordField
          admin={{
            description: 'Database password for connecting to your database server.',
            placeholder: 'Database password',
          }}
          label="Database Password"
          name="dbPassword"
          path="dbPassword"
          required={true}
        />
      </div>
    </div>
  ),
}
