import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { Card } from '../../../packages/ui/src/elements/Card'

const meta = {
  argTypes: {
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
      <div style={{ maxWidth: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Card component - showcasing non-link functionality to avoid Next.js router issues in Storybook.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Card (Simple)',
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    title: 'Basic Card',
  },
}

export const WithHeading: Story = {
  args: {
    title: 'Card with H2 Title',
    titleAs: 'h2',
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
    title: 'Card with Action Buttons',
  },
}

export const WithComplexActions: Story = {
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
    title: 'Card with Multiple Actions',
    titleAs: 'h3',
  },
}

export const CardGrid: Story = {
  render: () => {
    const cards = [
      { id: 'pages', title: 'Pages Collection' },
      { id: 'users', title: 'Users Collection' },
      { id: 'media', title: 'Media Collection' },
      { id: 'settings', title: 'Settings', titleAs: 'h3' as const },
    ]

    return (
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          maxWidth: '800px',
          padding: '20px',
        }}
      >
        {cards.map((card) => (
          <Card
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button buttonStyle="secondary" size="small">
                  Edit
                </Button>
                <Button buttonStyle="primary" size="small">
                  View
                </Button>
              </div>
            }
            key={card.id}
            title={card.title}
            titleAs={card.titleAs}
          />
        ))}
      </div>
    )
  },
}

export const VariousSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <Card
        actions={
          <Button buttonStyle="primary" size="small">
            Action
          </Button>
        }
        title="Small Card"
        titleAs="h4"
      />

      <Card
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button buttonStyle="secondary" size="small">
              Cancel
            </Button>
            <Button buttonStyle="primary" size="small">
              Continue
            </Button>
          </div>
        }
        title="Medium Card with Longer Title"
        titleAs="h3"
      />

      <Card
        actions={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Button buttonStyle="none" icon="edit" size="small" />
            <Button buttonStyle="none" icon="trash" size="small" />
            <Button buttonStyle="pill" size="small">
              Tag
            </Button>
            <Button buttonStyle="secondary" size="small">
              Draft
            </Button>
            <Button buttonStyle="primary" size="small">
              Publish
            </Button>
          </div>
        }
        title="Large Card with Multiple Action Types"
        titleAs="h2"
      />
    </div>
  ),
}
