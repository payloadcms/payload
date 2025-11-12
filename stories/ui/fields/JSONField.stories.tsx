import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import the actual Payload JSON field styles
import '../../../packages/ui/src/fields/JSON/index.scss'

// Mock JSON Field component that simulates the real JSONField behavior
interface JSONFieldProps {
  admin?: {
    description?: string
    disabled?: boolean
    placeholder?: string
  }
  label: string
  name: string
  onChange?: (value: string) => void
  path: string
  required?: boolean
  value?: object | string
}

const JSONField: React.FC<JSONFieldProps> = ({
  name,
  admin = {},
  label,
  onChange,
  required,
  value = '',
}) => {
  const { description, disabled } = admin
  const [jsonValue, setJsonValue] = React.useState(
    typeof value === 'string' ? value : JSON.stringify(value, null, 2),
  )
  const [error, setError] = React.useState('')

  const validateJSON = (jsonString: string) => {
    if (!jsonString.trim()) {
      setError(required ? 'This field is required' : '')
      return
    }

    try {
      JSON.parse(jsonString)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON format')
    }
  }

  const handleChange = (newValue: string) => {
    setJsonValue(newValue)
    validateJSON(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  React.useEffect(() => {
    validateJSON(jsonValue)
  }, [jsonValue, required])

  return (
    <div
      className={[fieldBaseClass, 'field-type', 'json', error && 'error', disabled && 'read-only']
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel label={label} required={required} />
      {description && <FieldDescription description={description} />}
      <div className={`${fieldBaseClass}__wrap`}>
        <textarea
          className="json__input"
          disabled={disabled}
          name={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter valid JSON..."
          style={{
            backgroundColor: 'var(--theme-input-bg)',
            border: `1px solid ${error ? 'var(--theme-error-500)' : 'var(--theme-elevation-150)'}`,
            borderRadius: 'var(--style-radius-s, 4px)',
            boxShadow: '0 2px 2px -1px rgba(0, 0, 0, 0.1)',
            color: 'var(--theme-elevation-800)',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            minHeight: '200px',
            padding: 'calc(var(--base) * 0.4) calc(var(--base) * 0.75)',
            width: '100%',
          }}
          value={jsonValue}
        />
      </div>
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
      description: 'Label for the JSON field',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  component: JSONField,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '800px', padding: '20px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'JSONField provides JSON editing with syntax highlighting, validation, and formatting capabilities.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/JSONField',
} satisfies Meta<typeof JSONField>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'jsonData',
    label: 'JSON Data',
    path: 'jsonData',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'requiredJson',
    label: 'Required JSON Configuration',
    path: 'requiredJson',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'configJson',
    admin: {
      description:
        'Enter your application configuration as valid JSON. This will be validated before saving.',
    },
    label: 'Application Configuration',
    path: 'configJson',
    required: false,
  },
}

export const WithDefaultValue: Story = {
  args: {
    name: 'defaultJson',
    admin: {
      description: 'Default settings configuration loaded on initialization.',
    },
    defaultValue: {
      autoSave: false,
      notifications: true,
      theme: 'light',
    },
    label: 'Settings JSON',
    path: 'defaultJson',
    required: false,
  },
}

export const Interactive: Story = {
  render: () => {
    const [jsonValue, setJsonValue] = React.useState('')
    const [validationStatus, setValidationStatus] = React.useState({ error: '', isValid: true })

    const validateJSON = (value: string) => {
      if (!value.trim()) {
        setValidationStatus({ error: '', isValid: true })
        return
      }

      try {
        JSON.parse(value)
        setValidationStatus({ error: '', isValid: true })
      } catch (error) {
        setValidationStatus({
          error: error instanceof Error ? error.message : 'Invalid JSON format',
          isValid: false,
        })
      }
    }

    const sampleConfigs = {
      apiConfig: JSON.stringify(
        {
          authentication: {
            type: 'bearer',
            refreshEnabled: true,
          },
          endpoints: {
            base: 'https://api.example.com/v1',
            retries: 3,
            timeout: 5000,
          },
          rateLimit: {
            requests: 100,
            window: '1h',
          },
        },
        null,
        2,
      ),
      pageLayout: JSON.stringify(
        {
          columns: 3,
          layout: 'grid',
          responsive: {
            breakpoints: {
              desktop: 1200,
              mobile: 768,
              tablet: 1024,
            },
          },
          sections: [
            { type: 'header', height: 'auto' },
            { type: 'sidebar', width: '250px' },
            { type: 'main', flex: 1 },
            { type: 'footer', height: '60px' },
          ],
        },
        null,
        2,
      ),
      userSettings: JSON.stringify(
        {
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
            preferences: {
              language: 'en',
              notifications: {
                email: true,
                push: false,
                sms: false,
              },
              theme: 'dark',
            },
          },
        },
        null,
        2,
      ),
    }

    React.useEffect(() => {
      validateJSON(jsonValue)
    }, [jsonValue])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive JSON Editor</h3>
          <p>Select a sample configuration or type your own JSON to see real-time validation.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {Object.entries(sampleConfigs).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setJsonValue(value)}
                style={{
                  backgroundColor: 'var(--theme-elevation-50)',
                  border: '1px solid var(--theme-elevation-150)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '6px 12px',
                }}
                type="button"
              >
                Load {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </button>
            ))}
            <button
              onClick={() => setJsonValue('')}
              style={{
                backgroundColor: 'var(--theme-error-50)',
                border: '1px solid var(--theme-error-200)',
                borderRadius: '4px',
                color: 'var(--theme-error-500)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 12px',
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        <JSONField
          admin={{
            description: 'JSON validation status is shown below the editor.',
          }}
          label="Interactive JSON Editor"
          name="interactiveJson"
          onChange={(value) =>
            setJsonValue(typeof value === 'string' ? value : JSON.stringify(value, null, 2))
          }
          path="interactiveJson"
          required={false}
          value={jsonValue}
        />

        <div
          style={{
            backgroundColor: validationStatus.isValid
              ? 'var(--theme-success-50)'
              : 'var(--theme-error-50)',
            border: `1px solid ${validationStatus.isValid ? 'var(--theme-success-200)' : 'var(--theme-error-200)'}`,
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>{validationStatus.isValid ? '✅' : '❌'}</span>
            <strong>{validationStatus.isValid ? 'Valid JSON' : 'Invalid JSON'}</strong>
          </div>
          {validationStatus.error && (
            <div style={{ color: 'var(--theme-error-500)', fontSize: '14px' }}>
              Error: {validationStatus.error}
            </div>
          )}
          {validationStatus.isValid && jsonValue && (
            <div style={{ color: 'var(--theme-success-600)', fontSize: '14px' }}>
              JSON is properly formatted and valid.
            </div>
          )}
        </div>
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>JSON Field Validation States</h3>

      <div>
        <h4>Valid JSON Object</h4>
        <JSONField
          label="Valid JSON Configuration"
          name="validJson"
          path="validJson"
          required={false}
          value={JSON.stringify(
            {
              count: 42,
              enabled: true,
              status: 'active',
              tags: ['json', 'validation', 'example'],
            },
            null,
            2,
          )}
        />
      </div>

      <div>
        <h4>Valid JSON Array</h4>
        <JSONField
          label="Valid JSON Array"
          name="validArray"
          path="validArray"
          required={false}
          value={JSON.stringify(
            [
              { id: 1, name: 'Item One' },
              { id: 2, name: 'Item Two' },
              { id: 3, name: 'Item Three' },
            ],
            null,
            2,
          )}
        />
      </div>

      <div>
        <h4>Invalid JSON Syntax</h4>
        <JSONField
          admin={{
            description: 'This example shows invalid JSON with missing quotes and trailing comma.',
          }}
          label="Invalid JSON"
          name="invalidJson"
          path="invalidJson"
          required={false}
          value={`{
  name: "John Doe",
  age: 30,
  active: true,
}`}
        />
      </div>

      <div>
        <h4>Required but Empty</h4>
        <JSONField
          admin={{
            description: 'This field is required but currently empty.',
          }}
          label="Required JSON"
          name="requiredEmpty"
          path="requiredEmpty"
          required={true}
          value=""
        />
      </div>
    </div>
  ),
}

export const JSONExamples: Story = {
  render: () => {
    const examples = [
      {
        description: 'Complete user profile with nested objects',
        json: {
          id: 'user_12345',
          permissions: ['read', 'write', 'admin'],
          profile: {
            avatar: 'https://example.com/avatars/sarah.jpg',
            email: 'sarah.johnson@example.com',
            firstName: 'Sarah',
            lastName: 'Johnson',
          },
          settings: {
            language: 'en-US',
            notifications: {
              email: true,
              push: false,
              sms: true,
            },
            theme: 'dark',
            timezone: 'America/New_York',
          },
        },
        title: 'User Profile',
      },
      {
        description: 'Typical REST API response structure',
        json: {
          data: {
            pagination: {
              limit: 10,
              page: 1,
              total: 3,
              totalPages: 1,
            },
            users: [
              { id: 1, name: 'Alice', role: 'admin' },
              { id: 2, name: 'Bob', role: 'editor' },
              { id: 3, name: 'Charlie', role: 'viewer' },
            ],
          },
          meta: {
            requestId: 'req_abcd1234',
            timestamp: '2024-01-15T10:30:00Z',
            version: '1.2.0',
          },
          success: true,
        },
        title: 'API Response Schema',
      },
      {
        description: 'Application configuration with various data types',
        json: {
          app: {
            name: 'My Application',
            debug: false,
            features: {
              analytics: true,
              authentication: true,
              caching: false,
            },
            version: '2.1.0',
          },
          cache: {
            type: 'redis',
            maxSize: '100MB',
            ttl: 3600,
          },
          database: {
            name: 'myapp_db',
            host: 'localhost',
            poolSize: 10,
            port: 5432,
            ssl: true,
          },
        },
        title: 'Configuration Settings',
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h3>JSON Examples</h3>

        {examples.map(({ description, json, title }, index) => (
          <div key={index}>
            <h4>{title}</h4>
            <p style={{ color: 'var(--theme-elevation-400)', marginBottom: '16px' }}>
              {description}
            </p>
            <JSONField
              label={`${title} JSON`}
              name={`example${index}`}
              path={`example${index}`}
              required={false}
              value={JSON.stringify(json, null, 2)}
            />
          </div>
        ))}
      </div>
    )
  },
}

export const RealWorldExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h3>Real-world JSON Field Use Cases</h3>

      <div>
        <h4>Website Meta Tags</h4>
        <JSONField
          admin={{
            description: 'SEO meta tags and social media configuration for this page.',
          }}
          label="Meta Tags Configuration"
          name="metaTags"
          path="metaTags"
          required={false}
          value={JSON.stringify(
            {
              description: 'The best platform for managing your content and workflows.',
              keywords: ['cms', 'content management', 'workflow'],
              openGraph: {
                type: 'website',
                description: 'The best platform for managing your content and workflows.',
                image: 'https://example.com/og-image.jpg',
                title: 'Welcome to Our Platform',
              },
              title: 'Welcome to Our Platform',
              twitter: {
                card: 'summary_large_image',
                creator: '@ourplatform',
                site: '@ourplatform',
              },
            },
            null,
            2,
          )}
        />
      </div>

      <div>
        <h4>Form Field Configuration</h4>
        <JSONField
          admin={{
            description:
              'Dynamic form field configuration that defines field types, validation rules, and display options.',
          }}
          label="Form Schema"
          name="formSchema"
          path="formSchema"
          required={true}
          value={JSON.stringify(
            {
              fields: [
                {
                  name: 'firstName',
                  type: 'text',
                  label: 'First Name',
                  required: true,
                  validation: {
                    maxLength: 50,
                    minLength: 2,
                  },
                },
                {
                  name: 'email',
                  type: 'email',
                  label: 'Email Address',
                  required: true,
                  validation: {
                    pattern: '^[^@]+@[^@]+\\.[^@]+$',
                  },
                },
                {
                  name: 'preferences',
                  type: 'select',
                  label: 'Notification Preferences',
                  options: [
                    { label: 'All Notifications', value: 'all' },
                    { label: 'Important Only', value: 'important' },
                    { label: 'No Notifications', value: 'none' },
                  ],
                },
              ],
            },
            null,
            2,
          )}
        />
      </div>

      <div>
        <h4>API Integration Settings</h4>
        <JSONField
          admin={{
            description:
              'Third-party API integration configuration including endpoints, authentication, and retry policies.',
          }}
          label="Integration Configuration"
          name="integrationConfig"
          path="integrationConfig"
          required={false}
          value={JSON.stringify(
            {
              defaults: {
                rateLimit: {
                  requests: 100,
                  window: 60000,
                },
                retries: 1,
                timeout: 10000,
              },
              services: {
                sendgrid: {
                  auth: {
                    type: 'apikey',
                    keyEnvVar: 'SENDGRID_API_KEY',
                  },
                  baseUrl: 'https://api.sendgrid.com/v3',
                  retries: 2,
                  timeout: 15000,
                },
                stripe: {
                  auth: {
                    type: 'bearer',
                    keyEnvVar: 'STRIPE_SECRET_KEY',
                  },
                  baseUrl: 'https://api.stripe.com/v1',
                  retries: 3,
                  timeout: 30000,
                },
              },
            },
            null,
            2,
          )}
        />
      </div>

      <div>
        <h4>Content Layout Configuration</h4>
        <JSONField
          admin={{
            description:
              'Page layout configuration that defines sections, components, and styling options.',
          }}
          label="Page Layout"
          name="pageLayout"
          path="pageLayout"
          required={false}
          value={JSON.stringify(
            {
              sections: [
                {
                  id: 'hero',
                  type: 'hero',
                  props: {
                    backgroundImage: '/images/hero-bg.jpg',
                    ctaButtons: [
                      { href: '/signup', text: 'Get Started', variant: 'primary' },
                      { href: '/about', text: 'Learn More', variant: 'secondary' },
                    ],
                    subtitle: 'Manage your content with ease',
                    title: 'Welcome to Our Platform',
                  },
                },
                {
                  id: 'features',
                  type: 'feature-grid',
                  props: {
                    columns: 3,
                    features: [
                      { description: 'Intuitive interface', icon: 'check', title: 'Easy to Use' },
                      { description: 'Advanced features', icon: 'zap', title: 'Powerful' },
                      { description: 'Enterprise security', icon: 'shield', title: 'Secure' },
                    ],
                  },
                },
              ],
              settings: {
                maxWidth: '1200px',
                padding: '20px',
                theme: 'light',
              },
            },
            null,
            2,
          )}
        />
      </div>
    </div>
  ),
}
