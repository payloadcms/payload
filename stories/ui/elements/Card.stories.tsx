import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Card } from '../../../packages/ui/src/elements/Card'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component used throughout Payload CMS for displaying content in organized containers.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title text for the card',
    },
    titleAs: {
      control: 'select',
      options: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'HTML tag to use for the title',
    },
    href: {
      control: 'text',
      description: 'URL to make the entire card clickable',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for the card',
    },
    buttonAriaLabel: {
      control: 'text',
      description: 'Aria label for the card button when clickable',
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Default Card',
  },
}

export const WithActions: Story = {
  args: {
    title: 'Card with Actions',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">Edit</Button>
        <Button buttonStyle="primary" size="small">View</Button>
      </div>
    ),
  },
}

export const Clickable: Story = {
  args: {
    title: 'Clickable Card',
    onClick: () => alert('Card clicked!'),
    buttonAriaLabel: 'Click to view details',
  },
}

export const WithLink: Story = {
  args: {
    title: 'Card with Link',
    href: '#example-link',
    buttonAriaLabel: 'Navigate to example page',
  },
}

export const WithHeading: Story = {
  args: {
    title: 'Card with H2 Title',
    titleAs: 'h2',
    actions: (
      <Button buttonStyle="pill" size="small" icon="edit">
        Edit
      </Button>
    ),
  },
}

export const ComplexActions: Story = {
  args: {
    title: 'Card with Complex Actions',
    actions: (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button buttonStyle="none" icon="edit" size="small" />
        <Button buttonStyle="none" icon="trash" size="small" />
        <Button buttonStyle="primary" size="small">View Details</Button>
      </div>
    ),
  },
}

export const CardGrid: Story = {
  render: () => {
    const cardData = [
      {
        title: 'Pages Collection',
        actions: (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button buttonStyle="secondary" size="small">Edit</Button>
            <Button buttonStyle="primary" size="small">View</Button>
          </div>
        ),
      },
      {
        title: 'Users Collection',
        onClick: () => alert('Users clicked!'),
        buttonAriaLabel: 'View users collection',
      },
      {
        title: 'Media Collection',
        href: '#media',
        buttonAriaLabel: 'Navigate to media collection',
      },
      {
        title: 'Settings',
        titleAs: 'h3' as const,
        actions: (
          <Button buttonStyle="pill" size="small" icon="gear">
            Configure
          </Button>
        ),
      },
    ]
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px',
        padding: '20px'
      }}>
        {cardData.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    )
  },
}

export const InteractiveDemo: Story = {
  render: () => {
    const [clickCount, setClickCount] = React.useState(0)
    const [actionCount, setActionCount] = React.useState(0)
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Interactive Card Demo</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p>Card clicked: {clickCount} times</p>
          <p>Actions clicked: {actionCount} times</p>
        </div>
        
        <Card
          title="Interactive Card"
          onClick={() => setClickCount(prev => prev + 1)}
          buttonAriaLabel="Click to increment card counter"
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                buttonStyle="secondary" 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation()
                  setActionCount(prev => prev + 1)
                }}
              >
                Action 1
              </Button>
              <Button 
                buttonStyle="primary" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionCount(prev => prev + 1)
                }}
              >
                Action 2
              </Button>
            </div>
          }
        />
        
        <p style={{ fontSize: '14px', color: '#666', marginTop: '16px' }}>
          Click the card to increment the card counter, or click the action buttons to increment the action counter.
        </p>
      </div>
    )
  },
}

export const VariousStates: Story = {
  render: () => {
    const states = [
      {
        title: 'Basic Card',
        description: 'Simple card with just a title',
      },
      {
        title: 'Card with Actions',
        actions: <Button buttonStyle="primary" size="small">Primary Action</Button>,
        description: 'Card with action buttons',
      },
      {
        title: 'Clickable Card',
        onClick: () => console.log('Clicked!'),
        description: 'Entire card is clickable',
      },
      {
        title: 'Card with Link',
        href: '#link-example',
        description: 'Card that navigates to a URL',
      },
      {
        title: 'Complex Card',
        titleAs: 'h3' as const,
        onClick: () => console.log('Complex card clicked!'),
        actions: (
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button buttonStyle="none" icon="edit" size="small" />
            <Button buttonStyle="none" icon="trash" size="small" />
          </div>
        ),
        description: 'Card with title tag, click handler, and icon actions',
      },
    ]
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Various Card States</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {states.map((state, index) => (
            <div key={index}>
              <Card {...state} />
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                margin: '8px 0 0 0',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                {state.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  },
}