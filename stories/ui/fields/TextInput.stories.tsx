import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

// Simple component interfaces to avoid complex imports
interface TextInputProps {
  disabled?: boolean
  hasError?: boolean
  id?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  path: string
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  type?: string
  value: string
}

// Mock TextInput component
const TextInput: React.FC<TextInputProps> = ({
  type = 'text',
  disabled,
  hasError,
  onChange,
  placeholder,
  readOnly,
  required,
  value,
  ...props
}) => (
  <input
    {...props}
    disabled={disabled}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={readOnly}
    required={required}
    style={{
      backgroundColor: disabled
        ? 'var(--theme-elevation-50)'
        : readOnly
          ? 'var(--theme-elevation-50)'
          : 'var(--theme-elevation-0)',
      border: hasError
        ? '1px solid var(--theme-error-500)'
        : '1px solid var(--theme-elevation-150)',
      borderRadius: '4px',
      fontSize: '14px',
      maxWidth: '300px',
      outline: 'none',
      padding: '8px 12px',
      width: '100%',
    }}
    type={type}
    value={value}
  />
)

// Simple field helper components
const FieldLabel: React.FC<{ htmlFor?: string; label: string; required?: boolean }> = ({
  htmlFor,
  label,
  required,
}) => (
  <label
    htmlFor={htmlFor}
    style={{
      color: 'var(--theme-elevation-800)',
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '4px',
    }}
  >
    {label}
    {required && <span style={{ color: 'var(--theme-error-500)', marginLeft: '4px' }}>*</span>}
  </label>
)

const FieldError: React.FC<{ message: string | string[] }> = ({ message }) => (
  <div
    style={{
      alignItems: 'center',
      color: 'var(--theme-error-500)',
      display: 'flex',
      fontSize: '12px',
      gap: '4px',
      marginTop: '4px',
    }}
  >
    <span>⚠</span>
    {Array.isArray(message) ? (
      <div>
        {message.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    ) : (
      message
    )}
  </div>
)

const FieldDescription: React.FC<{ description: string }> = ({ description }) => (
  <div
    style={{
      color: 'var(--theme-elevation-400)',
      fontSize: '12px',
      lineHeight: '1.4',
      marginTop: '4px',
    }}
  >
    {description}
  </div>
)

// Simple provider wrapper
const SimpleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: 'system-ui, sans-serif' }}>{children}</div>
)

const meta = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether the field has validation errors',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the field is read-only',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    value: {
      control: 'text',
      description: 'Current input value',
    },
  },
  component: TextInput,
  decorators: [
    (Story) => (
      <SimpleProvider>
        <div style={{ maxWidth: '600px', padding: '20px' }}>
          <Story />
        </div>
      </SimpleProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Text input components for forms - includes basic TextInput and complete TextField with label, description, and error handling.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/Text Input',
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

// Basic TextInput stories
export const BasicTextInput: Story = {
  args: {
    disabled: false,
    hasError: false,
    placeholder: 'Enter text here...',
    readOnly: false,
    required: false,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value || '')

    return (
      <TextInput
        {...args}
        onChange={(e) => setValue(e.target.value)}
        path="example-field"
        value={value}
      />
    )
  },
}

export const TextInputVariants: Story = {
  render: () => {
    const [values, setValues] = useState({
      basic: '',
      disabled: '',
      error: 'Invalid input',
      readOnly: 'This is read-only text',
      required: '',
    })

    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>TextInput Variants</h3>

        <div>
          <h4>Basic Input</h4>
          <TextInput
            onChange={handleChange('basic')}
            path="basic-input"
            placeholder="Basic text input"
            value={values.basic}
          />
        </div>

        <div>
          <h4>Required Input</h4>
          <TextInput
            onChange={handleChange('required')}
            path="required-input"
            placeholder="Required field"
            required={true}
            value={values.required}
          />
        </div>

        <div>
          <h4>Read-Only Input</h4>
          <TextInput
            onChange={handleChange('readOnly')}
            path="readonly-input"
            readOnly={true}
            value={values.readOnly}
          />
        </div>

        <div>
          <h4>Disabled Input</h4>
          <TextInput
            disabled={true}
            onChange={handleChange('disabled')}
            path="disabled-input"
            placeholder="Disabled input"
            value={values.disabled}
          />
        </div>

        <div>
          <h4>Input with Error</h4>
          <TextInput
            hasError={true}
            onChange={handleChange('error')}
            path="error-input"
            placeholder="Input with error"
            value={values.error}
          />
        </div>
      </div>
    )
  },
}

export const TextInputTypes: Story = {
  render: () => {
    const [values, setValues] = useState({
      email: '',
      password: '',
      search: '',
      tel: '',
      text: '',
      url: '',
    })

    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Input Types</h3>

        <div>
          <h4>Text (default)</h4>
          <TextInput
            onChange={handleChange('text')}
            path="text-type"
            placeholder="Regular text input"
            value={values.text}
          />
        </div>

        <div>
          <h4>Email</h4>
          <TextInput
            onChange={handleChange('email')}
            path="email-type"
            placeholder="Enter email address"
            type="email"
            value={values.email}
          />
        </div>

        <div>
          <h4>Password</h4>
          <TextInput
            onChange={handleChange('password')}
            path="password-type"
            placeholder="Enter password"
            type="password"
            value={values.password}
          />
        </div>

        <div>
          <h4>URL</h4>
          <TextInput
            onChange={handleChange('url')}
            path="url-type"
            placeholder="https://example.com"
            type="url"
            value={values.url}
          />
        </div>

        <div>
          <h4>Telephone</h4>
          <TextInput
            onChange={handleChange('tel')}
            path="tel-type"
            placeholder="+1 (555) 123-4567"
            type="tel"
            value={values.tel}
          />
        </div>

        <div>
          <h4>Search</h4>
          <TextInput
            onChange={handleChange('search')}
            path="search-type"
            placeholder="Search for something..."
            type="search"
            value={values.search}
          />
        </div>
      </div>
    )
  },
}

// Complete TextField stories
export const CompleteTextField: Story = {
  render: () => {
    const [value, setValue] = useState('')
    const [error, setError] = useState<null | string>(null)

    const validateEmail = (val: string) => {
      if (!val) {
        setError('Email is required')
      } else if (!/\S[^\s@]*@\S+\.\S+/.test(val)) {
        setError('Please enter a valid email address')
      } else {
        setError(null)
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3>Complete TextField Example</h3>

        <FieldLabel htmlFor="email-field" label="Email Address" required={true} />

        <TextInput
          hasError={!!error}
          id="email-field"
          onChange={(e) => {
            setValue(e.target.value)
            validateEmail(e.target.value)
          }}
          path="email-field"
          placeholder="Enter your email address"
          required={true}
          type="email"
          value={value}
        />

        <FieldDescription description="We'll use this email to send you important updates about your account." />

        {error && <FieldError message={error} />}

        {value && !error && (
          <div
            style={{
              backgroundColor: 'var(--theme-success-100)',
              border: '1px solid var(--theme-success-300)',
              borderRadius: '4px',
              color: 'var(--theme-success-700)',
              fontSize: '14px',
              padding: '8px 12px',
            }}
          >
            ✓ Valid email address
          </div>
        )}
      </div>
    )
  },
}

export const FormIntegrationExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      company: '',
      email: '',
      firstName: '',
      lastName: '',
      website: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    }

    const validate = () => {
      const newErrors: Record<string, string> = {}

      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required'
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required'
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/\S[^\s@]*@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }

      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        newErrors.website = 'Website must start with http:// or https://'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (validate()) {
        console.log('Form submitted:', formData)
        alert('Form submitted successfully! Check console for data.')
      }
    }

    return (
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <h3>User Registration Form</h3>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <FieldLabel htmlFor="first-name" label="First Name" required={true} />
            <TextInput
              hasError={!!errors.firstName}
              id="first-name"
              onChange={handleChange('firstName')}
              path="first-name"
              placeholder="Enter first name"
              required={true}
              value={formData.firstName}
            />
            {errors.firstName && <FieldError message={errors.firstName} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <FieldLabel htmlFor="last-name" label="Last Name" required={true} />
            <TextInput
              hasError={!!errors.lastName}
              id="last-name"
              onChange={handleChange('lastName')}
              path="last-name"
              placeholder="Enter last name"
              required={true}
              value={formData.lastName}
            />
            {errors.lastName && <FieldError message={errors.lastName} />}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="email" label="Email Address" required={true} />
          <TextInput
            hasError={!!errors.email}
            id="email"
            onChange={handleChange('email')}
            path="email"
            placeholder="Enter email address"
            required={true}
            type="email"
            value={formData.email}
          />
          {errors.email && <FieldError message={errors.email} />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="company" label="Company" />
          <TextInput
            id="company"
            onChange={handleChange('company')}
            path="company"
            placeholder="Enter company name (optional)"
            value={formData.company}
          />
          <FieldDescription description="Your current company or organization" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel htmlFor="website" label="Website" />
          <TextInput
            hasError={!!errors.website}
            id="website"
            onChange={handleChange('website')}
            path="website"
            placeholder="https://your-website.com"
            type="url"
            value={formData.website}
          />
          {errors.website && <FieldError message={errors.website} />}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            style={{
              backgroundColor: 'var(--theme-primary-500)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--theme-elevation-0)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '12px 24px',
            }}
            type="submit"
          >
            Create Account
          </button>
        </div>

        {/* Debug Info - Toggle visibility */}
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
            🔍 Show Form Data (Debug)
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
            <strong>Form Data:</strong>
            <br />
            {JSON.stringify(formData, null, 2)}
          </div>
        </details>
      </form>
    )
  },
}
