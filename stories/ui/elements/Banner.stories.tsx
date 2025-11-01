import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Banner } from '../../../packages/ui/src/elements/Banner'
import { CheckIcon } from '../../../packages/ui/src/icons/Check'
import { XIcon } from '../../../packages/ui/src/icons/X'
import { EditIcon } from '../../../packages/ui/src/icons/Edit'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Banner',
  component: Banner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Banner component for displaying notifications, alerts, and status messages in Payload CMS.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: ['default', 'error', 'info', 'success'],
      description: 'Visual style type of the banner',
    },
    alignIcon: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Alignment of the icon within the banner',
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
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'This is a default banner message',
    type: 'default',
  },
}

export const Success: Story = {
  args: {
    children: 'Operation completed successfully!',
    type: 'success',
    icon: <CheckIcon />,
  },
}

export const Error: Story = {
  args: {
    children: 'An error occurred while processing your request',
    type: 'error',
    icon: <XIcon />,
  },
}

export const Info: Story = {
  args: {
    children: 'Here is some helpful information for you',
    type: 'info',
    icon: <EditIcon />,
  },
}

export const WithLeftIcon: Story = {
  args: {
    children: 'Banner with icon on the left side',
    type: 'info',
    icon: <CheckIcon />,
    alignIcon: 'left',
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Banner with icon on the right side (default)',
    type: 'success',
    icon: <CheckIcon />,
    alignIcon: 'right',
  },
}

export const Clickable: Story = {
  args: {
    children: 'Click this banner to trigger an action',
    type: 'info',
    icon: <EditIcon />,
    onClick: () => alert('Banner clicked!'),
  },
}

export const WithLink: Story = {
  args: {
    children: 'This banner links to another page',
    type: 'default',
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
          type="info"
          icon={<EditIcon />}
          onClick={() => {
            setClickCount(prev => prev + 1)
            setLastAction('Clicked info banner')
          }}
        >
          Clickable banner (clicked {clickCount} times)
        </Banner>
        
        <Banner
          type="success"
          icon={<CheckIcon />}
          to="#success-link"
          onClick={() => setLastAction('Navigated via success banner')}
        >
          Banner with link navigation
        </Banner>
        
        <Banner
          type="default"
          icon={<EditIcon />}
          alignIcon="left"
          onClick={() => {
            setLastAction('Left-aligned icon banner clicked')
          }}
        >
          Left-aligned icon with click action
        </Banner>
        
        {lastAction && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f7fafc', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
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
      
      <Banner type="info" icon={<EditIcon />}>
        Short message
      </Banner>
      
      <Banner type="success" icon={<CheckIcon />}>
        This is a longer banner message that demonstrates how the banner 
        component handles multi-line content and maintains its styling 
        across different content lengths.
      </Banner>
      
      <Banner type="error" icon={<XIcon />}>
        <div>
          <strong>Error Details:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Connection timeout</li>
            <li>Invalid credentials</li>
            <li>Server unavailable</li>
          </ul>
        </div>
      </Banner>
      
      <Banner type="default">
        Banner without icon
      </Banner>
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
        <Banner type="success" icon={<CheckIcon />}>
          Document saved successfully at {new Date().toLocaleTimeString()}
        </Banner>
      </div>
      
      <div>
        <h4>Validation Error</h4>
        <Banner type="error" icon={<XIcon />}>
          Please fix the following errors before saving: Required fields missing
        </Banner>
      </div>
      
      <div>
        <h4>Feature Information</h4>
        <Banner 
          type="info" 
          icon={<EditIcon />}
          to="#learn-more"
        >
          New feature available! Click here to learn more about advanced search.
        </Banner>
      </div>
      
      <div>
        <h4>System Maintenance</h4>
        <Banner type="default" icon={<EditIcon />} alignIcon="left">
          Scheduled maintenance will occur tonight from 11 PM to 2 AM EST
        </Banner>
      </div>
    </div>
  ),
}