import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { AppHeader } from './index.js'

const meta: Meta<typeof AppHeader> = {
  argTypes: {
    CustomAvatar: {
      control: false,
      description: 'Custom avatar component to render instead of default Account icon',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Customization',
      },
    },
    CustomIcon: {
      control: false,
      description: 'Custom icon component to render in the step navigation',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Customization',
      },
    },
  },
  component: AppHeader,
  parameters: {
    docs: {
      description: {
        component:
          'The main application header component that provides navigation, actions, and user account access. It includes step navigation, custom actions, localization, and mobile navigation controls.',
      },
    },
    layout: 'fullscreen',
    payloadContext: true,
  },
  title: 'Elements/AppHeader',
}

export default meta
type Story = StoryObj<typeof AppHeader>

// Basic usage - comprehensive header with all features
export const Basic: Story = {
  args: {
    CustomAvatar: (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(45deg, #007bff, #28a745)',
          borderRadius: '50%',
          color: 'white',
          display: 'flex',
          fontSize: '14px',
          fontWeight: 'bold',
          height: '32px',
          justifyContent: 'center',
          width: '32px',
        }}
      >
        SB
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
        <Story />
        <div style={{ background: '#f5f5f5', marginTop: '20px', padding: '20px' }}>
          <h3>Page Content</h3>
          <p>
            This demonstrates the AppHeader with all its key features: custom avatar, custom step
            nav icon, responsive design, and proper integration with PayloadCMS contexts. The header
            includes step navigation, actions area, account access, and mobile navigation controls.
          </p>
          <div
            style={{
              background: '#e9ecef',
              borderRadius: '8px',
              marginTop: '20px',
              padding: '16px',
            }}
          >
            <h4>Features Demonstrated:</h4>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Custom avatar with gradient background</li>
              <li>Custom step navigation icon</li>
              <li>Responsive design (try resizing the window)</li>
              <li>Mobile hamburger menu (visible on small screens)</li>
              <li>Step navigation breadcrumbs</li>
              <li>Actions area with dynamic content</li>
              <li>Account access link</li>
              <li>Localization support (when enabled)</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive AppHeader demonstration showing all key features including custom avatar, custom step nav icon, responsive design, step navigation, actions area, and account access. This is the complete header experience as it would appear in a real PayloadCMS admin interface.',
      },
    },
  },
}

// Mobile view simulation
export const MobileView: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
        <div style={{ border: '1px solid #ccc', margin: '0 auto', width: '375px' }}>
          <Story />
          <div style={{ background: '#f5f5f5', padding: '20px' }}>
            <h3>Mobile Content</h3>
            <p>This simulates the mobile view where the hamburger menu is visible.</p>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Mobile view simulation showing how the AppHeader adapts to smaller screens with the hamburger menu visible.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
