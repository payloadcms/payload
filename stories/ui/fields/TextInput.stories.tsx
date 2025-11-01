import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'

// Simple component interfaces to avoid complex imports
interface TextInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  hasError?: boolean
  path: string
  id?: string
}

// Mock TextInput component
const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  disabled,
  readOnly,
  hasError,
  ...props
}) => (
  <input
    {...props}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    readOnly={readOnly}
    style={{
      padding: '8px 12px',
      border: hasError ? '1px solid #e53e3e' : '1px solid #e2e8f0',
      borderRadius: '4px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: disabled ? '#f7fafc' : readOnly ? '#f8f9fa' : 'white',
      width: '100%',
      maxWidth: '300px',
    }}
  />
)

// Simple field helper components
const FieldLabel: React.FC<{ label: string; required?: boolean; htmlFor?: string }> = ({ 
  label, 
  required, 
  htmlFor 
}) => (
  <label 
    htmlFor={htmlFor}
    style={{ 
      fontSize: '14px', 
      fontWeight: '500', 
      color: '#2d3748',
      marginBottom: '4px',
      display: 'block' 
    }}
  >
    {label}
    {required && <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>}
  </label>
)

const FieldError: React.FC<{ message: string | string[] }> = ({ message }) => (
  <div style={{ 
    color: '#e53e3e', 
    fontSize: '12px', 
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}>
    <span>⚠</span>
    {Array.isArray(message) ? (
      <div>
        {message.map((msg, idx) => <div key={idx}>{msg}</div>)}
      </div>
    ) : (
      message
    )}
  </div>
)

const FieldDescription: React.FC<{ description: string }> = ({ description }) => (
  <div style={{ 
    color: '#718096', 
    fontSize: '12px', 
    marginTop: '4px',
    lineHeight: '1.4'
  }}>
    {description}
  </div>
)

// Simple provider wrapper
const SimpleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: 'system-ui, sans-serif' }}>
    {children}
  </div>
)

const meta = {
  title: 'UI/Fields/Text Input',
  component: TextInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Text input components for forms - includes basic TextInput and complete TextField with label, description, and error handling.',
      },
    },
  },
  decorators: [
    (Story) => (
      <SimpleProvider>
        <div style={{ maxWidth: '600px', padding: '20px' }}>
          <Story />
        </div>
      </SimpleProvider>
    ),
  ],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current input value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when empty',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the field is read-only',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    hasError: {
      control: 'boolean',
      description: 'Whether the field has validation errors',
    },
  },
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

// Basic TextInput stories
export const BasicTextInput: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value || '')
    
    return (
      <TextInput
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        path="example-field"
      />
    )
  },
  args: {
    placeholder: 'Enter text here...',
    required: false,
    readOnly: false,
    disabled: false,
    hasError: false,
  },
}

export const TextInputVariants: Story = {
  render: () => {
    const [values, setValues] = useState({
      basic: '',
      required: '',
      readOnly: 'This is read-only text',
      disabled: '',
      error: 'Invalid input',
    })
    
    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(prev => ({ ...prev, [key]: e.target.value }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h3>TextInput Variants</h3>
        
        <div>
          <h4>Basic Input</h4>
          <TextInput
            value={values.basic}
            onChange={handleChange('basic')}
            placeholder="Basic text input"
            path="basic-input"
          />
        </div>
        
        <div>
          <h4>Required Input</h4>
          <TextInput
            value={values.required}
            onChange={handleChange('required')}
            placeholder="Required field"
            required={true}
            path="required-input"
          />
        </div>
        
        <div>
          <h4>Read-Only Input</h4>
          <TextInput
            value={values.readOnly}
            onChange={handleChange('readOnly')}
            readOnly={true}
            path="readonly-input"
          />
        </div>
        
        <div>
          <h4>Disabled Input</h4>
          <TextInput
            value={values.disabled}
            onChange={handleChange('disabled')}
            placeholder="Disabled input"
            disabled={true}
            path="disabled-input"
          />
        </div>
        
        <div>
          <h4>Input with Error</h4>
          <TextInput
            value={values.error}
            onChange={handleChange('error')}
            placeholder="Input with error"
            hasError={true}
            path="error-input"
          />
        </div>
      </div>
    )
  },
}

export const TextInputTypes: Story = {
  render: () => {
    const [values, setValues] = useState({
      text: '',
      email: '',
      password: '',
      url: '',
      tel: '',
      search: '',
    })
    
    const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues(prev => ({ ...prev, [key]: e.target.value }))
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Input Types</h3>
        
        <div>
          <h4>Text (default)</h4>
          <TextInput
            value={values.text}
            onChange={handleChange('text')}
            placeholder="Regular text input"
            path="text-type"
          />
        </div>
        
        <div>
          <h4>Email</h4>
          <TextInput
            value={values.email}
            onChange={handleChange('email')}
            type="email"
            placeholder="Enter email address"
            path="email-type"
          />
        </div>
        
        <div>
          <h4>Password</h4>
          <TextInput
            value={values.password}
            onChange={handleChange('password')}
            type="password"
            placeholder="Enter password"
            path="password-type"
          />
        </div>
        
        <div>
          <h4>URL</h4>
          <TextInput
            value={values.url}
            onChange={handleChange('url')}
            type="url"
            placeholder="https://example.com"
            path="url-type"
          />
        </div>
        
        <div>
          <h4>Telephone</h4>
          <TextInput
            value={values.tel}
            onChange={handleChange('tel')}
            type="tel"
            placeholder="+1 (555) 123-4567"
            path="tel-type"
          />
        </div>
        
        <div>
          <h4>Search</h4>
          <TextInput
            value={values.search}
            onChange={handleChange('search')}
            type="search"
            placeholder="Search for something..."
            path="search-type"
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
    const [error, setError] = useState<string | null>(null)
    
    const validateEmail = (val: string) => {
      if (!val) {
        setError('Email is required')
      } else if (!/\S+@\S+\.\S+/.test(val)) {
        setError('Please enter a valid email address')
      } else {
        setError(null)
      }
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3>Complete TextField Example</h3>
        
        <FieldLabel 
          label="Email Address" 
          required={true}
          htmlFor="email-field"
        />
        
        <TextInput
          id="email-field"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            validateEmail(e.target.value)
          }}
          type="email"
          placeholder="Enter your email address"
          hasError={!!error}
          required={true}
          path="email-field"
        />
        
        <FieldDescription description="We'll use this email to send you important updates about your account." />
        
        {error && <FieldError message={error} />}
        
        {value && !error && (
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724',
            fontSize: '14px'
          }}>
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
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      website: '',
    })
    
    const [errors, setErrors] = useState<Record<string, string>>({})
    
    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    }
    
    const validate = () => {
      const newErrors: Record<string, string> = {}
      
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>User Registration Form</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <FieldLabel label="First Name" required={true} htmlFor="first-name" />
            <TextInput
              id="first-name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              placeholder="Enter first name"
              hasError={!!errors.firstName}
              required={true}
              path="first-name"
            />
            {errors.firstName && <FieldError message={errors.firstName} />}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <FieldLabel label="Last Name" required={true} htmlFor="last-name" />
            <TextInput
              id="last-name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              placeholder="Enter last name"
              hasError={!!errors.lastName}
              required={true}
              path="last-name"
            />
            {errors.lastName && <FieldError message={errors.lastName} />}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Email Address" required={true} htmlFor="email" />
          <TextInput
            id="email"
            value={formData.email}
            onChange={handleChange('email')}
            type="email"
            placeholder="Enter email address"
            hasError={!!errors.email}
            required={true}
            path="email"
          />
          {errors.email && <FieldError message={errors.email} />}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Company" htmlFor="company" />
          <TextInput
            id="company"
            value={formData.company}
            onChange={handleChange('company')}
            placeholder="Enter company name (optional)"
            path="company"
          />
          <FieldDescription description="Your current company or organization" />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FieldLabel label="Website" htmlFor="website" />
          <TextInput
            id="website"
            value={formData.website}
            onChange={handleChange('website')}
            type="url"
            placeholder="https://your-website.com"
            hasError={!!errors.website}
            path="website"
          />
          {errors.website && <FieldError message={errors.website} />}
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>
        
        {/* Debug Info - Toggle visibility */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{ 
            cursor: 'pointer',
            padding: '8px 0',
            fontSize: '14px',
            color: '#666',
            userSelect: 'none'
          }}>
            🔍 Show Form Data (Debug)
          </summary>
          <div style={{ 
            marginTop: '8px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #dee2e6'
          }}>
            <strong>Form Data:</strong><br />
            {JSON.stringify(formData, null, 2)}
          </div>
        </details>
      </form>
    )
  },
}