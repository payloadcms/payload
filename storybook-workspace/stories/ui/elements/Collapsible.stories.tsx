import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { Collapsible, CollapsibleProvider } from '../../../packages/ui/src/elements/Collapsible'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    collapsibleStyle: {
      control: 'select',
      description: 'Visual style of the collapsible',
      options: ['default', 'error'],
    },
    disableHeaderToggle: {
      control: 'boolean',
      description: 'Disable clicking on header to toggle state',
    },
    disableToggleIndicator: {
      control: 'boolean',
      description: 'Hide the chevron toggle indicator',
    },
    header: {
      control: 'text',
      description: 'Content to display in the collapsible header',
    },
    initCollapsed: {
      control: 'boolean',
      description: 'Whether the collapsible starts in a collapsed state',
    },
  },
  component: Collapsible,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <CollapsibleProvider>
          <div style={{ maxWidth: '600px', padding: '20px', width: '100%' }}>
            <Story />
          </div>
        </CollapsibleProvider>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Collapsible component for showing and hiding content with smooth animations.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Collapsible',
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <p>This is the collapsible content that can be shown or hidden.</p>
        <p>It supports any React content and maintains smooth animations.</p>
      </div>
    ),
    header: 'Click to expand',
  },
}

export const InitiallyCollapsed: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <p>These advanced settings are initially hidden.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>
            <input type="checkbox" /> Enable debug mode
          </label>
          <label>
            <input type="checkbox" /> Show performance metrics
          </label>
          <label>
            <input type="checkbox" /> Enable experimental features
          </label>
        </div>
      </div>
    ),
    header: 'Advanced Settings',
    initCollapsed: true,
  },
}

export const WithActions: Story = {
  args: {
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">
          Edit
        </Button>
        <Button buttonStyle="secondary" size="small">
          Delete
        </Button>
      </div>
    ),
    children: (
      <div style={{ padding: '16px' }}>
        <h4>Document Configuration</h4>
        <p>Configure how this document behaves and appears to users.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input placeholder="Document title" type="text" />
          <textarea placeholder="Description" rows={3} />
          <button>Save Changes</button>
        </div>
      </div>
    ),
    header: 'Document Settings',
  },
}

export const ErrorState: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <h4 style={{ color: '#e53e3e', marginTop: 0 }}>Please fix the following errors:</h4>
        <ul style={{ color: '#e53e3e' }}>
          <li>Title is required</li>
          <li>Email format is invalid</li>
          <li>Password must be at least 8 characters</li>
        </ul>
      </div>
    ),
    collapsibleStyle: 'error',
    header: 'Validation Errors',
  },
}

export const DisabledToggleIndicator: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <p>This collapsible has the toggle indicator (chevron) hidden.</p>
        <p>It can still be toggled by clicking on the header.</p>
      </div>
    ),
    disableToggleIndicator: true,
    header: 'Custom Toggle Control',
  },
}

// Multiple collapsibles example
export const MultipleCollapsibles: Story = {
  render: () => {
    const sections = [
      {
        id: 'account',
        content: (
          <div>
            <p>Manage your account details and preferences.</p>
            <input
              placeholder="Full Name"
              style={{ marginBottom: '8px', width: '100%' }}
              type="text"
            />
            <input placeholder="Email Address" style={{ width: '100%' }} type="email" />
          </div>
        ),
        title: 'Account Information',
      },
      {
        id: 'security',
        content: (
          <div>
            <p>Configure security options for your account.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>
                <input type="checkbox" /> Enable two-factor authentication
              </label>
              <label>
                <input type="checkbox" /> Email notifications for login
              </label>
              <label>
                <input type="checkbox" /> Require password change every 90 days
              </label>
            </div>
          </div>
        ),
        title: 'Security Settings',
      },
      {
        id: 'notifications',
        content: (
          <div>
            <p>Choose which notifications you want to receive.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>
                <input defaultChecked type="checkbox" /> Email notifications
              </label>
              <label>
                <input defaultChecked type="checkbox" /> Push notifications
              </label>
              <label>
                <input type="checkbox" /> SMS notifications
              </label>
            </div>
          </div>
        ),
        title: 'Notification Preferences',
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3>User Settings</h3>
        {sections.map((section) => (
          <Collapsible
            header={section.title}
            initCollapsed={section.id !== 'account'}
            key={section.id}
          >
            <div style={{ padding: '16px' }}>{section.content}</div>
          </Collapsible>
        ))}
      </div>
    )
  },
}

// Controlled collapsible example
export const ControlledCollapsible: Story = {
  render: () => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [actionLog, setActionLog] = useState<string[]>([])

    const handleToggle = (collapsed: boolean) => {
      setIsCollapsed(collapsed)
      setActionLog((prev) => [
        ...prev.slice(-4), // Keep only last 5 entries
        `${new Date().toLocaleTimeString()}: ${collapsed ? 'Collapsed' : 'Expanded'}`,
      ])
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3>Controlled Collapsible</h3>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button buttonStyle="primary" onClick={() => handleToggle(false)} size="small">
            Expand
          </Button>
          <Button buttonStyle="secondary" onClick={() => handleToggle(true)} size="small">
            Collapse
          </Button>
        </div>

        <Collapsible
          header={`Collapsible Content (${isCollapsed ? 'Collapsed' : 'Expanded'})`}
          isCollapsed={isCollapsed}
          onToggle={handleToggle}
        >
          <div style={{ padding: '16px' }}>
            <p>This collapsible's state is controlled externally.</p>
            <p>You can use the buttons above or click the header to toggle it.</p>

            {actionLog.length > 0 && (
              <div
                style={{
                  backgroundColor: '#f7fafc',
                  borderRadius: '4px',
                  marginTop: '16px',
                  padding: '12px',
                }}
              >
                <strong>Action Log:</strong>
                <ul style={{ fontSize: '12px', margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {actionLog.map((log, index) => (
                    <li key={index}>{log}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Collapsible>
      </div>
    )
  },
}

// Complex content example
export const ComplexContent: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Rich Content Example</h3>

      <Collapsible
        actions={
          <Button buttonStyle="secondary" size="small">
            View Full Docs
          </Button>
        }
        header="API Documentation"
      >
        <div style={{ padding: '16px' }}>
          <h4>GET /api/users</h4>
          <p>Retrieves a list of users with optional filtering and pagination.</p>

          <h5>Parameters:</h5>
          <table style={{ borderCollapse: 'collapse', fontSize: '14px', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc' }}>
                <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left' }}>
                  Parameter
                </th>
                <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left' }}>
                  Type
                </th>
                <th style={{ border: '1px solid #e2e8f0', padding: '8px', textAlign: 'left' }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>page</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>number</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                  Page number for pagination
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>limit</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>number</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '8px' }}>
                  Number of results per page
                </td>
              </tr>
            </tbody>
          </table>

          <h5>Example Response:</h5>
          <pre
            style={{
              backgroundColor: '#2d3748',
              borderRadius: '4px',
              color: '#f7fafc',
              fontSize: '12px',
              overflow: 'auto',
              padding: '12px',
            }}
          >
            {`{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}`}
          </pre>
        </div>
      </Collapsible>
    </div>
  ),
}
