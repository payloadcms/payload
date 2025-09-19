import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { DeleteDocument } from './index.js'

const meta: Meta<typeof DeleteDocument> = {
  component: DeleteDocument,
  parameters: {
    docs: {
      description: {
        component:
          'A component that provides functionality to delete documents in PayloadCMS with confirmation modal and trash support.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/DeleteDocument',
}

export default meta

type Story = StoryObj<typeof DeleteDocument>

const containerStyles: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  justifyContent: 'center',
  margin: '0 auto',
  maxWidth: '800px',
  minHeight: '100vh',
  padding: '20px',
  width: '100%',
}

export const Basic: Story = {
  args: {
    id: '123',
    collectionSlug: 'posts',
    singularLabel: 'Post',
    title: 'Sample Post Title',
    useAsTitle: 'title',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of DeleteDocument showing the delete button and confirmation modal for a post document.',
      },
    },
  },
  render: (args) => {
    return (
      <div style={containerStyles}>
        <DeleteDocument {...args} />
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px' }}>
          Click the "Delete" button to see the confirmation modal.
        </div>
      </div>
    )
  },
}
