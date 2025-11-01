import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { Card } from '../../../packages/ui/src/elements/Card'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    buttonAriaLabel: {
      control: 'text',
      description: 'Aria label for the card button when clickable',
    },
    href: {
      control: 'text',
      description: 'URL to make the entire card clickable',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for the card',
    },
    title: {
      control: 'text',
      description: 'The main title text for the card',
    },
    titleAs: {
      control: 'select',
      description: 'HTML tag to use for the title',
      options: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
  component: Card,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Card component used throughout Payload CMS for displaying content in organized containers.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Card',
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
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">
          Edit
        </Button>
        <Button buttonStyle="primary" size="small">
          View
        </Button>
      </div>
    ),
    title: 'Card with Actions',
  },
}

export const Clickable: Story = {
  args: {
    buttonAriaLabel: 'Click to view details',
    onClick: () => alert('Card clicked!'),
    title: 'Clickable Card',
  },
}

export const WithLink: Story = {
  args: {
    buttonAriaLabel: 'Navigate to example page',
    href: '#example-link',
    title: 'Card with Link',
  },
}

export const WithHeading: Story = {
  args: {
    actions: (
      <Button buttonStyle="pill" icon="edit" size="small">
        Edit
      </Button>
    ),
    title: 'Card with H2 Title',
    titleAs: 'h2',
  },
}

export const ComplexActions: Story = {
  args: {
    actions: (
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        <Button buttonStyle="none" icon="edit" size="small" />
        <Button buttonStyle="none" icon="trash" size="small" />
        <Button buttonStyle="primary" size="small">
          View Details
        </Button>
      </div>
    ),
    title: 'Card with Complex Actions',
  },
}

export const CardGrid: Story = {
  render: () => {
    const cardData = [
      {
        actions: (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button buttonStyle="secondary" size="small">
              Edit
            </Button>
            <Button buttonStyle="primary" size="small">
              View
            </Button>
          </div>
        ),
        title: 'Pages Collection',
      },
      {
        buttonAriaLabel: 'View users collection',
        onClick: () => alert('Users clicked!'),
        title: 'Users Collection',
      },
      {
        buttonAriaLabel: 'Navigate to media collection',
        href: '#media',
        title: 'Media Collection',
      },
      {
        actions: (
          <Button buttonStyle="pill" icon="gear" size="small">
            Configure
          </Button>
        ),
        title: 'Settings',
        titleAs: 'h3' as const,
      },
    ]

    return (
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          padding: '20px',
        }}
      >
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
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                buttonStyle="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionCount((prev) => prev + 1)
                }}
                size="small"
              >
                Action 1
              </Button>
              <Button
                buttonStyle="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionCount((prev) => prev + 1)
                }}
                size="small"
              >
                Action 2
              </Button>
            </div>
          }
          buttonAriaLabel="Click to increment card counter"
          onClick={() => setClickCount((prev) => prev + 1)}
          title="Interactive Card"
        />

        <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>
          Click the card to increment the card counter, or click the action buttons to increment the
          action counter.
        </p>
      </div>
    )
  },
}

export const VariousStates: Story = {
  render: () => {
    const states = [
      {
        description: 'Simple card with just a title',
        title: 'Basic Card',
      },
      {
        actions: (
          <Button buttonStyle="primary" size="small">
            Primary Action
          </Button>
        ),
        description: 'Card with action buttons',
        title: 'Card with Actions',
      },
      {
        description: 'Entire card is clickable',
        onClick: () => console.log('Clicked!'),
        title: 'Clickable Card',
      },
      {
        description: 'Card that navigates to a URL',
        href: '#link-example',
        title: 'Card with Link',
      },
      {
        actions: (
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button buttonStyle="none" icon="edit" size="small" />
            <Button buttonStyle="none" icon="trash" size="small" />
          </div>
        ),
        description: 'Card with title tag, click handler, and icon actions',
        onClick: () => console.log('Complex card clicked!'),
        title: 'Complex Card',
        titleAs: 'h3' as const,
      },
    ]

    return (
      <div style={{ padding: '20px' }}>
        <h3>Various Card States</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {states.map((state, index) => (
            <div key={index}>
              <Card {...state} />
              <p
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  color: '#666',
                  fontSize: '14px',
                  margin: '8px 0 0 0',
                  padding: '8px',
                }}
              >
                {state.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
