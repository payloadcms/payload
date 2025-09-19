import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../Button/index.js'
import { Locked } from '../Locked/index.js'
import { Card } from './index.js'

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
        component:
          'A card component that can display a title, actions, and be clickable. Used extensively in the PayloadCMS dashboard for collections and globals.',
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

export const Clickable: Story = {
  args: {
    buttonAriaLabel: 'Open card details',
    href: '#',
    onClick: () => alert('Card clicked!'),
    title: 'Clickable Card',
  },
}

// Dashboard-specific examples based on PayloadCMS usage
export const CollectionCard: Story = {
  args: {
    id: 'card-posts',
    actions: (
      <Button
        aria-label="Create new Post"
        buttonStyle="icon-label"
        el="link"
        icon="plus"
        iconStyle="with-border"
        round
        to="/admin/collections/posts/create"
      />
    ),
    buttonAriaLabel: 'Show all Posts',
    href: '/admin/collections/posts',
    title: 'Posts',
    titleAs: 'h3',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A collection card as used in the PayloadCMS dashboard. Shows a create button action and navigates to the collection list.',
      },
    },
  },
}

export const GlobalCard: Story = {
  args: {
    id: 'card-site-settings',
    buttonAriaLabel: 'Edit Site Settings',
    href: '/admin/globals/site-settings',
    title: 'Site Settings',
    titleAs: 'h3',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A global card as used in the PayloadCMS dashboard. No create action since globals are single documents.',
      },
    },
  },
}

export const LockedCard: Story = {
  args: {
    id: 'card-locked',
    actions: (
      <Locked
        user={{
          id: '1',
          name: 'John Doe',
          collection: 'users',
          email: 'john@example.com',
        }}
      />
    ),
    buttonAriaLabel: 'Edit Site Settings',
    href: '/admin/globals/site-settings',
    title: 'Site Settings',
    titleAs: 'h3',
  },
  parameters: {
    docs: {
      description: {
        story: 'A locked card showing that another user is currently editing this document.',
      },
    },
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

export const DashboardLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A dashboard layout showcasing how cards are used in PayloadCMS admin interface.',
      },
    },
  },
  render: () => (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Collections</h2>
      <ul
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <Card
            actions={
              <Button
                aria-label="Create new Post"
                buttonStyle="icon-label"
                el="link"
                icon="plus"
                iconStyle="with-border"
                round
                to="/admin/collections/posts/create"
              />
            }
            buttonAriaLabel="Show all Posts"
            href="/admin/collections/posts"
            id="card-posts"
            title="Posts"
            titleAs="h3"
          />
        </li>
        <li>
          <Card
            actions={
              <Button
                aria-label="Create new User"
                buttonStyle="icon-label"
                el="link"
                icon="plus"
                iconStyle="with-border"
                round
                to="/admin/collections/users/create"
              />
            }
            buttonAriaLabel="Show all Users"
            href="/admin/collections/users"
            id="card-users"
            title="Users"
            titleAs="h3"
          />
        </li>
      </ul>

      <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>
        Globals
      </h2>
      <ul
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        <li>
          <Card
            buttonAriaLabel="Edit Site Settings"
            href="/admin/globals/site-settings"
            id="card-site-settings"
            title="Site Settings"
            titleAs="h3"
          />
        </li>
        <li>
          <Card
            actions={
              <Locked
                user={{
                  id: '2',
                  name: 'Jane Smith',
                  collection: 'users',
                  email: 'jane@example.com',
                }}
              />
            }
            buttonAriaLabel="Edit Header"
            href="/admin/globals/header"
            id="card-header"
            title="Header"
            titleAs="h3"
          />
        </li>
      </ul>
    </div>
  ),
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
