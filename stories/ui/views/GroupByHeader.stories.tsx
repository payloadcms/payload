import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React from 'react'

import { GroupByHeader } from '../../../packages/ui/src/views/List/GroupByHeader'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Mock collection config for the stories
const mockCollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  labels: {
    plural: 'Posts',
    singular: 'Post',
  },
}

const meta = {
  argTypes: {
    groupByFieldPath: {
      control: 'text',
      description: 'The field path used for grouping',
    },
    groupByValue: {
      control: 'text',
      description: 'The value of the group',
    },
    heading: {
      control: 'text',
      description: 'The heading text to display for this group',
    },
  },
  component: GroupByHeader,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ background: 'var(--theme-bg)', padding: '16px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'GroupByHeader component used in Payload list views when grouping items by a specific field.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Views/GroupByHeader',
} satisfies Meta<typeof GroupByHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    collectionConfig: mockCollectionConfig,
    groupByFieldPath: 'status',
    groupByValue: 'published',
    heading: 'Published',
  },
}

export const DraftStatus: Story = {
  args: {
    collectionConfig: mockCollectionConfig,
    groupByFieldPath: 'status',
    groupByValue: 'draft',
    heading: 'Draft',
  },
}

export const CategoryGroup: Story = {
  args: {
    collectionConfig: mockCollectionConfig,
    groupByFieldPath: 'category',
    groupByValue: 'technology',
    heading: 'Technology',
  },
}

export const AuthorGroup: Story = {
  args: {
    collectionConfig: mockCollectionConfig,
    groupByFieldPath: 'author',
    groupByValue: 'john-doe',
    heading: 'John Doe',
  },
}

export const LongHeading: Story = {
  args: {
    collectionConfig: mockCollectionConfig,
    groupByFieldPath: 'department',
    groupByValue: 'marketing-and-communications',
    heading: 'Marketing and Communications Department',
  },
}

// Multiple groups demonstration
export const MultipleGroups: Story = {
  render: () => {
    const groups = [
      {
        groupByFieldPath: 'status',
        groupByValue: 'published',
        heading: 'Published Posts',
      },
      {
        groupByFieldPath: 'status',
        groupByValue: 'draft',
        heading: 'Draft Posts',
      },
      {
        groupByFieldPath: 'status',
        groupByValue: 'archived',
        heading: 'Archived Posts',
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <h3>List View with Multiple Groups</h3>
        {groups.map((group, index) => (
          <GroupByHeader
            collectionConfig={mockCollectionConfig}
            groupByFieldPath={group.groupByFieldPath}
            groupByValue={group.groupByValue}
            heading={group.heading}
            key={index}
          />
        ))}
      </div>
    )
  },
}

// Different collection types
export const UsersCollection: Story = {
  args: {
    collectionConfig: {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      labels: {
        plural: 'Users',
        singular: 'User',
      },
    },
    groupByFieldPath: 'role',
    groupByValue: 'admin',
    heading: 'Administrators',
  },
}

export const MediaCollection: Story = {
  args: {
    collectionConfig: {
      slug: 'media',
      admin: {
        useAsTitle: 'filename',
      },
      labels: {
        plural: 'Media',
        singular: 'Media',
      },
    },
    groupByFieldPath: 'mimeType',
    groupByValue: 'image',
    heading: 'Images',
  },
}

// Contextual example showing how it would appear in a real list view
export const InListContext: Story = {
  render: () => (
    <div
      style={{
        background: 'var(--theme-bg)',
        border: '1px solid var(--theme-border-color)',
        borderRadius: '8px',
        padding: '0',
        width: '100%',
      }}
    >
      {/* Mock list header */}
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid var(--theme-border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <h2 style={{ fontSize: '18px', margin: 0 }}>Posts Collection</h2>
      </div>

      {/* Group by header as it appears in context */}
      <div style={{ padding: '12px 20px 0' }}>
        <GroupByHeader
          collectionConfig={mockCollectionConfig}
          groupByFieldPath="status"
          groupByValue="published"
          heading="Published (12)"
        />
      </div>

      {/* Mock table content */}
      <div
        style={{
          display: 'grid',
          fontSize: '14px',
          gridTemplateColumns: '1fr 120px 100px',
          padding: '12px 20px',
        }}
      >
        <div style={{ padding: '8px 0' }}>How to Build a CMS with Payload</div>
        <div style={{ padding: '8px 0' }}>Published</div>
        <div style={{ padding: '8px 0' }}>Dec 1, 2024</div>
      </div>
      <div
        style={{
          display: 'grid',
          fontSize: '14px',
          gridTemplateColumns: '1fr 120px 100px',
          padding: '12px 20px',
        }}
      >
        <div style={{ padding: '8px 0' }}>Getting Started with Next.js</div>
        <div style={{ padding: '8px 0' }}>Published</div>
        <div style={{ padding: '8px 0' }}>Nov 28, 2024</div>
      </div>

      {/* Second group */}
      <div style={{ padding: '20px 20px 0' }}>
        <GroupByHeader
          collectionConfig={mockCollectionConfig}
          groupByFieldPath="status"
          groupByValue="draft"
          heading="Draft (5)"
        />
      </div>

      <div
        style={{
          display: 'grid',
          fontSize: '14px',
          gridTemplateColumns: '1fr 120px 100px',
          padding: '12px 20px',
        }}
      >
        <div style={{ padding: '8px 0' }}>Advanced Payload Techniques</div>
        <div style={{ padding: '8px 0' }}>Draft</div>
        <div style={{ padding: '8px 0' }}>Nov 30, 2024</div>
      </div>
    </div>
  ),
}
