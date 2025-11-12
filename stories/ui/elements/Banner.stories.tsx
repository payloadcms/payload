import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CheckIcon, EditIcon, XIcon } from '@payloadcms/ui'
import React from 'react'

import { Banner } from '../../../packages/ui/src/elements/Banner'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    type: {
      control: 'select',
      description: 'Visual style type of the banner',
      options: ['default', 'error', 'info', 'success'],
    },
    alignIcon: {
      control: 'select',
      description: 'Alignment of the icon within the banner',
      options: ['left', 'right'],
    },
    children: {
      control: 'text',
      description: 'Content to display inside the banner',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    to: {
      control: 'text',
      description: 'URL to navigate to when banner is clicked',
    },
  },
  component: Banner,
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
          'Banner component for displaying notifications, alerts, and status messages in Payload CMS.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Banner',
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'default',
    children: 'This is a default banner message',
  },
}

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Operation completed successfully!',
    icon: <CheckIcon />,
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    children: 'An error occurred while processing your request',
    icon: <XIcon />,
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Here is some helpful information for you',
    icon: <EditIcon />,
  },
}

export const WithLeftIcon: Story = {
  args: {
    type: 'info',
    alignIcon: 'left',
    children: 'Banner with icon on the left side',
    icon: <CheckIcon />,
  },
}

export const WithRightIcon: Story = {
  args: {
    type: 'success',
    alignIcon: 'right',
    children: 'Banner with icon on the right side (default)',
    icon: <CheckIcon />,
  },
}

export const Clickable: Story = {
  args: {
    type: 'info',
    children: 'Click this banner to trigger an action',
    icon: <EditIcon />,
    onClick: () => alert('Banner clicked!'),
  },
}

export const WithLink: Story = {
  args: {
    type: 'default',
    children: 'This banner links to another page',
    icon: <EditIcon />,
    to: '#example-link',
  },
}

// Multiple banner types showcase
export const BannerTypes: Story = {
  render: () => {
    const banners = [
      {
        type: 'default' as const,
        children: 'Default banner - neutral information',
        icon: <EditIcon />,
      },
      {
        type: 'info' as const,
        children: 'Info banner - helpful tips and information',
        icon: <EditIcon />,
      },
      {
        type: 'success' as const,
        children: 'Success banner - operation completed',
        icon: <CheckIcon />,
      },
      {
        type: 'error' as const,
        children: 'Error banner - something went wrong',
        icon: <XIcon />,
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3>Banner Types</h3>
        {banners.map((banner, index) => (
          <Banner key={index} {...banner} />
        ))}
      </div>
    )
  },
}

// Interactive banner demo
export const InteractiveBanners: Story = {
  render: () => {
    const [clickCount, setClickCount] = React.useState(0)
    const [lastAction, setLastAction] = React.useState('')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3>Interactive Banners</h3>

        <Banner
          icon={<EditIcon />}
          onClick={() => {
            setClickCount((prev) => prev + 1)
            setLastAction('Clicked info banner')
          }}
          type="info"
        >
          Clickable banner (clicked {clickCount} times)
        </Banner>

        <Banner
          icon={<CheckIcon />}
          onClick={() => setLastAction('Navigated via success banner')}
          to="#success-link"
          type="success"
        >
          Banner with link navigation
        </Banner>

        <Banner
          alignIcon="left"
          icon={<EditIcon />}
          onClick={() => {
            setLastAction('Left-aligned icon banner clicked')
          }}
          type="default"
        >
          Left-aligned icon with click action
        </Banner>

        {lastAction && (
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-50)',
              borderRadius: '4px',
              fontSize: '14px',
              padding: '12px',
            }}
          >
            <strong>Last Action:</strong> {lastAction}
          </div>
        )}
      </div>
    )
  },
}

// Different content examples
export const ContentExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Content Examples</h3>

      <Banner icon={<EditIcon />} type="info">
        Short message
      </Banner>

      <Banner icon={<CheckIcon />} type="success">
        This is a longer banner message that demonstrates how the banner component handles
        multi-line content and maintains its styling across different content lengths.
      </Banner>

      <Banner icon={<XIcon />} type="error">
        <div>
          <strong>Error Details:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Connection timeout</li>
            <li>Invalid credentials</li>
            <li>Server unavailable</li>
          </ul>
        </div>
      </Banner>

      <Banner type="default">Banner without icon</Banner>
    </div>
  ),
}

// Real-world usage examples
export const UsageExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>Real-world Usage Examples</h3>

      <div>
        <h4>Document Save Status</h4>
        <Banner icon={<CheckIcon />} type="success">
          Document saved successfully at {new Date().toLocaleTimeString()}
        </Banner>
      </div>

      <div>
        <h4>Validation Error</h4>
        <Banner icon={<XIcon />} type="error">
          Please fix the following errors before saving: Required fields missing
        </Banner>
      </div>

      <div>
        <h4>Feature Information</h4>
        <Banner icon={<EditIcon />} to="#learn-more" type="info">
          New feature available! Click here to learn more about advanced search.
        </Banner>
      </div>

      <div>
        <h4>System Maintenance</h4>
        <Banner alignIcon="left" icon={<EditIcon />} type="default">
          Scheduled maintenance will occur tonight from 11 PM to 2 AM EST
        </Banner>
      </div>
    </div>
  ),
}
