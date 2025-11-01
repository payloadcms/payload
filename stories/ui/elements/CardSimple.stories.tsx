import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { Card } from '../../../packages/ui/src/elements/Card'
import { Button } from '../../../packages/ui/src/elements/Button'

const meta = {
  title: 'UI/Elements/Card (Simple)',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component - showcasing non-link functionality to avoid Next.js router issues in Storybook.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', padding: '20px' }}>
        <Story />
      </div>
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
  },
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
    title: 'Card with Action Buttons',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">Edit</Button>
        <Button buttonStyle="primary" size="small">View</Button>
      </div>
    ),
  },
}

export const WithComplexActions: Story = {
  args: {
    title: 'Card with Multiple Actions',
    titleAs: 'h3',
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
    const cards = [
      { title: 'Pages Collection', id: 'pages' },
      { title: 'Users Collection', id: 'users' },
      { title: 'Media Collection', id: 'media' },
      { title: 'Settings', id: 'settings', titleAs: 'h3' as const },
    ]
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px',
        padding: '20px',
        maxWidth: '800px'
      }}>
        {cards.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            titleAs={card.titleAs}
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button buttonStyle="secondary" size="small">Edit</Button>
                <Button buttonStyle="primary" size="small">View</Button>
              </div>
            }
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
        title="Small Card"
        titleAs="h4"
        actions={<Button buttonStyle="primary" size="small">Action</Button>}
      />
      
      <Card
        title="Medium Card with Longer Title"
        titleAs="h3"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button buttonStyle="secondary" size="small">Cancel</Button>
            <Button buttonStyle="primary" size="small">Continue</Button>
          </div>
        }
      />
      
      <Card
        title="Large Card with Multiple Action Types"
        titleAs="h2"
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button buttonStyle="none" icon="edit" size="small" />
            <Button buttonStyle="none" icon="trash" size="small" />
            <Button buttonStyle="pill" size="small">Tag</Button>
            <Button buttonStyle="secondary" size="small">Draft</Button>
            <Button buttonStyle="primary" size="small">Publish</Button>
          </div>
        }
      />
    </div>
  ),
}