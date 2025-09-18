import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { CopyToClipboard } from '../elements/CopyToClipboard/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof CopyToClipboard> = {
  args: {
    value: 'Hello, World!',
  },
  argTypes: {
    defaultMessage: {
      control: 'text',
      description: 'Message to show before copying',
    },
    successMessage: {
      control: 'text',
      description: 'Message to show after successful copy',
    },
    value: {
      control: 'text',
      description: 'Text value to copy to clipboard',
    },
  },
  component: CopyToClipboard,
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
        component:
          'A copy to clipboard component that allows users to copy text to their clipboard.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/CopyToClipboard',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    value: 'Hello, World!',
  },
}

export const WithCustomMessages: Story = {
  args: {
    defaultMessage: 'Click to copy',
    successMessage: 'Copied successfully!',
    value: 'Custom message example',
  },
}

export const LongText: Story = {
  args: {
    value:
      'This is a much longer text that demonstrates how the copy component handles longer content. It includes multiple sentences and should work just as well as shorter text.',
  },
}

export const CodeSnippet: Story = {
  args: {
    defaultMessage: 'Copy code',
    successMessage: 'Code copied!',
    value: 'npm install @payloadcms/next',
  },
}

export const URL: Story = {
  args: {
    defaultMessage: 'Copy URL',
    successMessage: 'URL copied!',
    value: 'https://payloadcms.com',
  },
}

export const JSONData: Story = {
  args: {
    defaultMessage: 'Copy JSON',
    successMessage: 'JSON copied!',
    value: JSON.stringify({ name: 'John', age: 30, city: 'New York' }, null, 2),
  },
}

export const EmptyValue: Story = {
  args: {
    value: '',
  },
}

export const UndefinedValue: Story = {
  args: {
    value: undefined,
  },
}

// In context examples
export const InCodeBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CopyToClipboard component in a code block context.',
      },
    },
  },
  render: () => (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        fontFamily: 'monospace',
        padding: '16px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span style={{ color: '#666', fontSize: '12px' }}>Terminal</span>
        <CopyToClipboard
          defaultMessage="Copy command"
          successMessage="Command copied!"
          value="npm install @payloadcms/next"
        />
      </div>
      <code style={{ fontSize: '14px' }}>npm install @payloadcms/next</code>
    </div>
  ),
}

export const InDataTable: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CopyToClipboard component in a data table context.',
      },
    },
  },
  render: () => (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ backgroundColor: '#f8f9fa' }}>
          <tr>
            <th style={{ borderBottom: '1px solid #e0e0e0', padding: '12px', textAlign: 'left' }}>
              ID
            </th>
            <th style={{ borderBottom: '1px solid #e0e0e0', padding: '12px', textAlign: 'left' }}>
              Name
            </th>
            <th style={{ borderBottom: '1px solid #e0e0e0', padding: '12px', textAlign: 'left' }}>
              Email
            </th>
            <th style={{ borderBottom: '1px solid #e0e0e0', padding: '12px', textAlign: 'left' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>12345</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>John Doe</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>john@example.com</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>
              <CopyToClipboard defaultMessage="Copy ID" successMessage="ID copied!" value="12345" />
            </td>
          </tr>
          <tr>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>67890</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>Jane Smith</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>jane@example.com</td>
            <td style={{ borderBottom: '1px solid #e0e0e0', padding: '12px' }}>
              <CopyToClipboard defaultMessage="Copy ID" successMessage="ID copied!" value="67890" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
}

export const InFormField: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CopyToClipboard component in a form field context.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <label
        htmlFor="api-key-input"
        style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}
      >
        API Key
      </label>
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        <input
          aria-label="API Key"
          id="api-key-input"
          readOnly
          style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            flex: 1,
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '8px 12px',
          }}
          type="text"
          value="sk-1234567890abcdef"
        />
        <CopyToClipboard
          defaultMessage="Copy API key"
          successMessage="API key copied!"
          value="sk-1234567890abcdef"
        />
      </div>
      <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
        Click the copy button to copy the API key to your clipboard.
      </p>
    </div>
  ),
}

export const InCard: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CopyToClipboard component in a card context.',
      },
    },
  },
  render: () => (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
      }}
    >
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ fontSize: '18px', margin: 0 }}>Configuration</h3>
        <CopyToClipboard
          defaultMessage="Copy config"
          successMessage="Config copied!"
          value={JSON.stringify(
            {
              apiUrl: 'https://api.example.com',
              retries: 3,
              timeout: 5000,
            },
            null,
            2,
          )}
        />
      </div>
      <pre
        style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
          margin: 0,
          overflow: 'auto',
          padding: '12px',
        }}
      >
        {JSON.stringify(
          {
            apiUrl: 'https://api.example.com',
            retries: 3,
            timeout: 5000,
          },
          null,
          2,
        )}
      </pre>
    </div>
  ),
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available copy to clipboard variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Basic examples */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Basic Examples</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span>Simple text:</span>
            <CopyToClipboard value="Hello, World!" />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span>URL:</span>
            <CopyToClipboard
              defaultMessage="Copy URL"
              successMessage="URL copied!"
              value="https://payloadcms.com"
            />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span>Code:</span>
            <CopyToClipboard
              defaultMessage="Copy code"
              successMessage="Code copied!"
              value="npm install @payloadcms/next"
            />
          </div>
        </div>
      </div>

      {/* Different content types */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Different Content Types</h3>
        <div
          style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '12px' }}>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <strong>JSON Data</strong>
              <CopyToClipboard
                defaultMessage="Copy JSON"
                successMessage="JSON copied!"
                value={JSON.stringify({ name: 'John', age: 30 }, null, 2)}
              />
            </div>
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '12px',
                margin: 0,
                padding: '8px',
              }}
            >
              {JSON.stringify({ name: 'John', age: 30 }, null, 2)}
            </pre>
          </div>

          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '12px' }}>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <strong>Long Text</strong>
              <CopyToClipboard
                defaultMessage="Copy text"
                successMessage="Text copied!"
                value="This is a much longer text that demonstrates how the copy component handles longer content. It includes multiple sentences and should work just as well as shorter text."
              />
            </div>
            <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
              This is a much longer text that demonstrates...
            </p>
          </div>
        </div>
      </div>

      {/* Edge cases */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Edge Cases</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span>Empty value:</span>
            <CopyToClipboard value="" />
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <span>Undefined value:</span>
            <CopyToClipboard value={undefined} />
          </div>
        </div>
        <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
          Note: Empty or undefined values will not render the copy button.
        </p>
      </div>
    </div>
  ),
}
