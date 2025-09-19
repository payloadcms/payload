import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Banner } from './index.js'

const meta: Meta<typeof Banner> = {
  argTypes: {
    type: {
      control: 'select',
      description: 'Visual style variant of the banner',
      options: ['default', 'error', 'info', 'success'],
      table: {
        type: { summary: "'default' | 'error' | 'info' | 'success'" },
        category: 'Appearance',
        defaultValue: { summary: "'default'" },
      },
    },
    alignIcon: {
      control: 'select',
      description: 'Position of the icon relative to the content',
      options: ['left', 'right'],
      table: {
        type: { summary: "'left' | 'right'" },
        category: 'Layout',
        defaultValue: { summary: "'right'" },
      },
    },
    children: {
      control: 'text',
      description: 'Content to display in the banner',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Content',
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
      table: {
        type: { summary: 'string' },
        category: 'Customization',
      },
    },
    icon: {
      control: false,
      description: 'Icon to display in the banner',
      table: {
        type: { summary: 'React.ReactNode' },
        category: 'Content',
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for interactive banners',
      table: {
        type: { summary: '(event: MouseEvent) => void' },
        category: 'Interaction',
      },
    },
    to: {
      control: 'text',
      description: 'URL for link banners',
      table: {
        type: { summary: 'string' },
        category: 'Navigation',
      },
    },
  },
  component: Banner,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A versatile banner component for displaying messages, notifications, and alerts. Supports different types, icons, and interactive behaviors including click handlers and links.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Banner',
}

export default meta
type Story = StoryObj<typeof Banner>

// Basic usage - comprehensive banner with all features
export const Basic: Story = {
  args: {
    type: 'success',
    children:
      'This is a comprehensive banner demonstrating all key features including different types, icons, and interactive behaviors.',
    icon: (
      <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Banner Component Features</h3>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>
            The Banner component supports multiple types, icons, and interactive behaviors. Try the
            controls below to see different configurations.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Success Banner (Current)</h4>
          <Story />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Error Banner</h4>
          <Banner
            icon={
              <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
              </svg>
            }
            type="error"
          >
            Something went wrong. Please try again.
          </Banner>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Info Banner</h4>
          <Banner
            icon={
              <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            }
            type="info"
          >
            This is an informational message with helpful details.
          </Banner>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Interactive Banner (Clickable)</h4>
          <Banner
            icon={
              <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
            onClick={() => alert('Banner clicked!')}
            type="default"
          >
            Click this banner to see the interaction
          </Banner>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Link Banner</h4>
          <Banner
            icon={
              <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            }
            to="/admin/settings"
            type="default"
          >
            Go to settings (this would navigate to /admin/settings)
          </Banner>
        </div>

        <div
          style={{ background: '#f8f9fa', borderRadius: '8px', marginTop: '20px', padding: '16px' }}
        >
          <h4 style={{ margin: '0 0 12px 0' }}>Features Demonstrated:</h4>
          <ul style={{ fontSize: '14px', margin: '0', paddingLeft: '20px' }}>
            <li>Multiple types: success, error, info, default</li>
            <li>Icon support with left/right alignment</li>
            <li>Interactive click handlers</li>
            <li>Link navigation with href</li>
            <li>Responsive design and hover states</li>
            <li>Accessibility features</li>
          </ul>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive Banner demonstration showing all key features including different types (success, error, info, default), icon support, interactive behaviors, and link navigation. This showcases the complete banner experience as it would appear in a real PayloadCMS admin interface.',
      },
    },
  },
}

// Mobile responsive banner
export const MobileView: Story = {
  args: {
    type: 'info',
    children:
      'This banner adapts to mobile screens with proper spacing and touch-friendly interactions.',
    icon: (
      <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '10px' }}>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            margin: '0 auto',
            overflow: 'hidden',
            width: '320px',
          }}
        >
          <div
            style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '16px' }}
          >
            <h3 style={{ fontSize: '16px', margin: '0' }}>Mobile Banner Demo</h3>
          </div>
          <div style={{ padding: '16px' }}>
            <Story />
            <div
              style={{
                background: '#e9ecef',
                borderRadius: '4px',
                fontSize: '14px',
                marginTop: '16px',
                padding: '12px',
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>Mobile features:</p>
              <ul style={{ margin: '0', paddingLeft: '16px' }}>
                <li>Touch-friendly sizing</li>
                <li>Proper spacing for small screens</li>
                <li>Readable text and icons</li>
                <li>Responsive layout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Mobile responsive banner demonstration showing how the component adapts to smaller screens with proper spacing, touch-friendly interactions, and optimized layout for mobile devices.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
