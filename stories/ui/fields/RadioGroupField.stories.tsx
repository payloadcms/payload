import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { FieldDescription } from '../../../packages/ui/src/fields/FieldDescription'
import { FieldError } from '../../../packages/ui/src/fields/FieldError'
import { FieldLabel } from '../../../packages/ui/src/fields/FieldLabel'
import { fieldBaseClass } from '../../../packages/ui/src/fields/shared'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Import the actual Payload RadioGroup field styles
import '../../../packages/ui/src/fields/RadioGroup/index.scss'
import '../../../packages/ui/src/fields/RadioGroup/Radio/index.scss'

interface Option {
  label: string
  value: string
}

interface RadioGroupFieldProps {
  admin?: {
    description?: string
    disabled?: boolean
    layout?: 'horizontal' | 'vertical'
  }
  label: string
  name: string
  onChange?: (value: string) => void
  options: Option[]
  path: string
  required?: boolean
  value?: string
}

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  name,
  admin = {},
  label,
  onChange,
  options,
  required,
  value = '',
}) => {
  const { description, disabled, layout = 'vertical' } = admin

  return (
    <div
      className={[
        fieldBaseClass,
        'radio-group',
        `radio-group--layout-${layout}`,
        required && !value && 'error',
        disabled && 'radio-group--read-only',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel label={label} required={required} />
      {description && <FieldDescription description={description} />}
      <div className={`${fieldBaseClass}__wrap`}>
        <ul className="radio-group--group">
          {options.map((option) => (
            <li key={option.value}>
              <label
                className={`radio-input${value === option.value ? ' radio-input--is-selected' : ''}`}
              >
                <input
                  checked={value === option.value}
                  disabled={disabled}
                  name={name}
                  onChange={() => onChange?.(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="radio-input__styled-radio" />
                <span className="radio-input__label">{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      {required && !value && <FieldError message="Please select an option" />}
    </div>
  )
}

const meta = {
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the field',
    },
    label: {
      control: 'text',
      description: 'Label for the radio group',
    },
    layout: {
      control: 'select',
      description: 'Layout orientation for radio buttons',
      options: ['horizontal', 'vertical'],
    },
    options: {
      control: 'object',
      description: 'Array of radio button options',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
  component: RadioGroupField,
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
          'RadioGroupField provides single-selection radio button groups with flexible layout options and validation.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Fields/RadioGroupField',
} satisfies Meta<typeof RadioGroupField>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'priority',
    label: 'Priority Level',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
    path: 'priority',
    required: false,
  },
}

export const HorizontalLayout: Story = {
  args: {
    name: 'status',
    admin: {
      layout: 'horizontal',
    },
    label: 'Document Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Review', value: 'review' },
      { label: 'Published', value: 'published' },
    ],
    path: 'status',
    required: false,
  },
}

export const VerticalLayout: Story = {
  args: {
    name: 'theme',
    admin: {
      layout: 'vertical',
    },
    label: 'Site Theme',
    options: [
      { label: 'Light Theme', value: 'light' },
      { label: 'Dark Theme', value: 'dark' },
      { label: 'Auto (System)', value: 'auto' },
    ],
    path: 'theme',
    required: false,
  },
}

export const Required: Story = {
  args: {
    name: 'agreement',
    label: 'Terms & Conditions',
    options: [
      { label: 'I accept the terms and conditions', value: 'accepted' },
      { label: 'I decline the terms and conditions', value: 'declined' },
    ],
    path: 'agreement',
    required: true,
  },
}

export const WithDescription: Story = {
  args: {
    name: 'visibility',
    admin: {
      description:
        'Choose who can view this content. This setting affects how the content appears in your site.',
      layout: 'vertical',
    },
    label: 'Content Visibility',
    options: [
      { label: 'Public - Visible to everyone', value: 'public' },
      { label: 'Private - Only visible to you', value: 'private' },
      { label: 'Protected - Visible to authenticated users', value: 'protected' },
    ],
    path: 'visibility',
    required: true,
  },
}

export const ManyOptions: Story = {
  args: {
    name: 'category',
    admin: {
      layout: 'vertical',
    },
    label: 'Article Category',
    options: [
      { label: 'Technology', value: 'technology' },
      { label: 'Business', value: 'business' },
      { label: 'Entertainment', value: 'entertainment' },
      { label: 'Sports', value: 'sports' },
      { label: 'Politics', value: 'politics' },
      { label: 'Health', value: 'health' },
      { label: 'Science', value: 'science' },
      { label: 'Education', value: 'education' },
    ],
    path: 'category',
    required: false,
  },
}

export const Interactive: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = React.useState('')
    const [layout, setLayout] = React.useState('vertical')

    const options = [
      { label: '🚀 Launch immediately', value: 'immediate' },
      { label: '⏰ Schedule for later', value: 'scheduled' },
      { label: '📝 Save as draft', value: 'draft' },
      { label: '👀 Preview first', value: 'preview' },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3>Interactive Radio Group</h3>
          <p>
            Current selection: <strong>{selectedValue || 'None selected'}</strong>
          </p>
        </div>

        <div style={{ alignItems: 'center', display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <label style={{ fontWeight: 'bold' }}>Layout:</label>
          <label style={{ alignItems: 'center', display: 'flex', gap: '4px' }}>
            <input
              checked={layout === 'vertical'}
              name="layoutToggle"
              onChange={() => setLayout('vertical')}
              type="radio"
            />
            Vertical
          </label>
          <label style={{ alignItems: 'center', display: 'flex', gap: '4px' }}>
            <input
              checked={layout === 'horizontal'}
              name="layoutToggle"
              onChange={() => setLayout('horizontal')}
              type="radio"
            />
            Horizontal
          </label>
        </div>

        <RadioGroupField
          admin={{
            description: `Layout: ${layout}. Selection will be shown above.`,
            layout,
          }}
          label="Publication Action"
          name="publishAction"
          onChange={(value) => setSelectedValue(value)}
          options={options}
          path="publishAction"
          required={true}
          value={selectedValue}
        />

        {selectedValue && (
          <div
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <strong>Selection Details:</strong>
            <br />
            Value: <code>{selectedValue}</code>
            <br />
            Label: {options.find((opt) => opt.value === selectedValue)?.label}
          </div>
        )}
      </div>
    )
  },
}

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3>Radio Group Validation States</h3>

      <div>
        <h4>Valid Selection</h4>
        <RadioGroupField
          label="Valid Choice"
          name="validChoice"
          options={[
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
            { label: 'Option C', value: 'c' },
          ]}
          path="validChoice"
          required={true}
          value="b"
        />
      </div>

      <div>
        <h4>Required but Empty</h4>
        <RadioGroupField
          admin={{
            description: 'This field is required but no option has been selected.',
          }}
          label="Required Selection"
          name="requiredEmpty"
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
            { label: 'Maybe', value: 'maybe' },
          ]}
          path="requiredEmpty"
          required={true}
          value=""
        />
      </div>

      <div>
        <h4>Disabled State</h4>
        <RadioGroupField
          admin={{
            description: 'This radio group is disabled and cannot be changed.',
            disabled: true,
          }}
          label="Disabled Radio Group"
          name="disabledGroup"
          options={[
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' },
            { label: 'Option 3', value: '3' },
          ]}
          path="disabledGroup"
          value="2"
        />
      </div>
    </div>
  ),
}

export const RealWorldExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h3>Real-world Radio Group Examples</h3>

      <div>
        <h4>User Role Selection</h4>
        <RadioGroupField
          admin={{
            description:
              "Select the role that best describes this user's permissions and access level.",
            layout: 'vertical',
          }}
          label="User Role"
          name="userRole"
          options={[
            { label: '👤 Viewer - Can view content only', value: 'viewer' },
            { label: '✏️ Editor - Can create and edit content', value: 'editor' },
            { label: '👨‍💼 Admin - Full access to all features', value: 'admin' },
            { label: '🔒 Super Admin - System-level access', value: 'super-admin' },
          ]}
          path="userRole"
          required={true}
        />
      </div>

      <div>
        <h4>Notification Preferences</h4>
        <RadioGroupField
          admin={{
            description: 'How would you like to receive notifications about important updates?',
            layout: 'vertical',
          }}
          label="Notification Method"
          name="notificationMethod"
          options={[
            { label: '📧 Email notifications', value: 'email' },
            { label: '📱 SMS text messages', value: 'sms' },
            { label: '🔔 In-app notifications only', value: 'in-app' },
            { label: '🔇 No notifications', value: 'none' },
          ]}
          path="notificationMethod"
          required={false}
        />
      </div>

      <div>
        <h4>Content Type</h4>
        <RadioGroupField
          admin={{
            description:
              'What type of content are you creating? This affects available fields and templates.',
            layout: 'horizontal',
          }}
          label="Content Type"
          name="contentType"
          options={[
            { label: 'Article', value: 'article' },
            { label: 'Page', value: 'page' },
            { label: 'Product', value: 'product' },
            { label: 'Event', value: 'event' },
          ]}
          path="contentType"
          required={true}
        />
      </div>

      <div>
        <h4>Pricing Plan</h4>
        <RadioGroupField
          admin={{
            description: 'Choose your subscription plan. You can upgrade or downgrade at any time.',
            layout: 'vertical',
          }}
          label="Subscription Plan"
          name="pricingPlan"
          options={[
            { label: '🆓 Free - Up to 5 projects', value: 'free' },
            { label: '💼 Professional - Up to 25 projects ($29/month)', value: 'pro' },
            { label: '🏢 Enterprise - Unlimited projects ($99/month)', value: 'enterprise' },
          ]}
          path="pricingPlan"
          required={true}
        />
      </div>
    </div>
  ),
}
