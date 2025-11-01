import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { Collapsible, CollapsibleProvider } from '../../../packages/ui/src/elements/Collapsible'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collapsible component for showing and hiding content with smooth animations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <CollapsibleProvider>
          <div style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
            <Story />
          </div>
        </CollapsibleProvider>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    header: {
      control: 'text',
      description: 'Content to display in the collapsible header',
    },
    collapsibleStyle: {
      control: 'select',
      options: ['default', 'error'],
      description: 'Visual style of the collapsible',
    },
    initCollapsed: {
      control: 'boolean',
      description: 'Whether the collapsible starts in a collapsed state',
    },
    disableHeaderToggle: {
      control: 'boolean',
      description: 'Disable clicking on header to toggle state',
    },
    disableToggleIndicator: {
      control: 'boolean',
      description: 'Hide the chevron toggle indicator',
    },
  },
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    header: 'Click to expand',
    children: (
      <div style={{ padding: '16px' }}>
        <p>This is the collapsible content that can be shown or hidden.</p>
        <p>It supports any React content and maintains smooth animations.</p>
      </div>
    ),
  },
}

export const InitiallyCollapsed: Story = {
  args: {
    header: 'Advanced Settings',
    initCollapsed: true,
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
  },
}

export const WithActions: Story = {
  args: {
    header: 'Document Settings',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">Edit</Button>
        <Button buttonStyle="secondary" size="small">Delete</Button>
      </div>
    ),
    children: (
      <div style={{ padding: '16px' }}>
        <h4>Document Configuration</h4>
        <p>Configure how this document behaves and appears to users.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="text" placeholder="Document title" />
          <textarea placeholder="Description" rows={3} />
          <button>Save Changes</button>
        </div>
      </div>
    ),
  },
}

export const ErrorState: Story = {
  args: {
    header: 'Validation Errors',
    collapsibleStyle: 'error',
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
  },
}

export const DisabledToggleIndicator: Story = {
  args: {
    header: 'Custom Toggle Control',
    disableToggleIndicator: true,
    children: (
      <div style={{ padding: '16px' }}>
        <p>This collapsible has the toggle indicator (chevron) hidden.</p>
        <p>It can still be toggled by clicking on the header.</p>
      </div>
    ),
  },
}

// Multiple collapsibles example
export const MultipleCollapsibles: Story = {
  render: () => {
    const sections = [
      {
        id: 'account',
        title: 'Account Information',
        content: (
          <div>
            <p>Manage your account details and preferences.</p>
            <input type="text" placeholder="Full Name" style={{ width: '100%', marginBottom: '8px' }} />
            <input type="email" placeholder="Email Address" style={{ width: '100%' }} />
          </div>
        ),
      },
      {
        id: 'security',
        title: 'Security Settings',
        content: (
          <div>
            <p>Configure security options for your account.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label><input type="checkbox" /> Enable two-factor authentication</label>
              <label><input type="checkbox" /> Email notifications for login</label>
              <label><input type="checkbox" /> Require password change every 90 days</label>
            </div>
          </div>
        ),
      },
      {
        id: 'notifications',
        title: 'Notification Preferences',
        content: (
          <div>
            <p>Choose which notifications you want to receive.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label><input type="checkbox" defaultChecked /> Email notifications</label>
              <label><input type="checkbox" defaultChecked /> Push notifications</label>
              <label><input type="checkbox" /> SMS notifications</label>
            </div>
          </div>
        ),
      },
    ]
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3>User Settings</h3>
        {sections.map((section) => (
          <Collapsible
            key={section.id}
            header={section.title}
            initCollapsed={section.id !== 'account'}
          >
            <div style={{ padding: '16px' }}>
              {section.content}
            </div>
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
      setActionLog(prev => [
        ...prev.slice(-4), // Keep only last 5 entries
        `${new Date().toLocaleTimeString()}: ${collapsed ? 'Collapsed' : 'Expanded'}`
      ])
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3>Controlled Collapsible</h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            buttonStyle="primary"
            size="small"
            onClick={() => handleToggle(false)}
          >
            Expand
          </Button>
          <Button
            buttonStyle="secondary"
            size="small"
            onClick={() => handleToggle(true)}
          >
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
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f7fafc',
                borderRadius: '4px'
              }}>
                <strong>Action Log:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
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
        header="API Documentation"
        actions={
          <Button buttonStyle="secondary" size="small">
            View Full Docs
          </Button>
        }
      >
        <div style={{ padding: '16px' }}>
          <h4>GET /api/users</h4>
          <p>Retrieves a list of users with optional filtering and pagination.</p>
          
          <h5>Parameters:</h5>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc' }}>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Parameter</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>page</td>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>number</td>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>Page number for pagination</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>limit</td>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>number</td>
                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>Number of results per page</td>
              </tr>
            </tbody>
          </table>
          
          <h5>Example Response:</h5>
          <pre style={{ 
            backgroundColor: '#2d3748', 
            color: '#f7fafc', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
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