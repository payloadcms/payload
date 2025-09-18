import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../elements/Button/index.js'
import { Card } from '../elements/Card/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Card> = {
  args: {
    title: 'Card Title',
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the card',
    },
    actions: {
      control: 'text',
      description: 'Actions to display in the card',
    },
    buttonAriaLabel: {
      control: 'text',
      description: 'Aria label for the clickable button',
    },
    href: {
      control: 'text',
      description: 'URL to navigate to when clicked',
    },
    onClick: {
      action: 'clicked',
      description: 'Function to call when card is clicked',
    },
    title: {
      control: 'text',
      description: 'Title text for the card',
    },
    titleAs: {
      control: 'select',
      description: 'HTML element to render as title',
      options: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
  component: Card,
  decorators: [
    (Story) => (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A card component that can display a title, actions, and be clickable.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Card',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    href: '#',
    title: 'Basic Card',
  },
}

export const WithActions: Story = {
  args: {
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="secondary" size="small">
          Edit
        </Button>
        <Button buttonStyle="error" size="small">
          Delete
        </Button>
      </div>
    ),
    href: '#',
    title: 'Card with Actions',
  },
}

export const Clickable: Story = {
  args: {
    buttonAriaLabel: 'Open card details',
    href: '#',
    onClick: () => alert('Card clicked!'),
    title: 'Clickable Card',
  },
}

export const WithLink: Story = {
  args: {
    href: '#',
    title: 'Card with Link',
  },
}

export const WithCustomTitleElement: Story = {
  args: {
    href: '#',
    title: 'Card with H2 Title',
    titleAs: 'h2',
  },
}

export const WithId: Story = {
  args: {
    id: 'custom-card-id',
    href: '#',
    title: 'Card with Custom ID',
  },
}

// Complex examples
export const FullFeatured: Story = {
  args: {
    id: 'project-card',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button buttonStyle="primary" size="small">
          View
        </Button>
        <Button buttonStyle="secondary" size="small">
          Edit
        </Button>
      </div>
    ),
    buttonAriaLabel: 'Open project details',
    href: '#',
    title: 'Project Alpha',
    titleAs: 'h3',
  },
}

export const MultipleCards: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of multiple cards in different configurations.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      }}
    >
      <Card href="#" title="Simple Card" />

      <Card
        actions={
          <Button buttonStyle="secondary" size="small">
            Action
          </Button>
        }
        href="#"
        title="Card with Action"
      />

      <Card
        buttonAriaLabel="Open details"
        href="#"
        onClick={() => alert('Clicked!')}
        title="Clickable Card"
      />

      <Card
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button buttonStyle="primary" size="small">
              View
            </Button>
            <Button buttonStyle="secondary" size="small">
              Edit
            </Button>
          </div>
        }
        buttonAriaLabel="Open project"
        href="#"
        title="Project Card"
        titleAs="h3"
      />
    </div>
  ),
}
