import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { DeleteMany } from './index.js'

const meta: Meta<typeof DeleteMany> = {
  component: DeleteMany,
  parameters: {
    docs: {
      description: {
        component:
          'A component that provides bulk deletion functionality for multiple documents in PayloadCMS with confirmation modal and trash support.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/DeleteMany',
}

export default meta

type Story = StoryObj<typeof DeleteMany>

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

// Mock collection configuration
const mockCollection = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  labels: {
    plural: 'Posts',
    singular: 'Post',
  },
  trash: true, // Enable trash functionality
}

export const Basic: Story = {
  args: {
    collection: mockCollection,
    viewType: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of DeleteMany showing the delete button that appears when documents are selected in a list view.',
      },
    },
  },
  render: (args) => {
    return (
      <div style={containerStyles}>
        <DeleteMany {...args} />
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', textAlign: 'center' }}>
          <p>
            <strong>Note:</strong> This component requires specific context providers to function:
          </p>
          <ul style={{ margin: '10px 0', textAlign: 'left' }}>
            <li>SelectionProvider for managing selected documents</li>
            <li>ConfigProvider with collection configuration</li>
            <li>TranslationProvider for internationalization</li>
            <li>ModalProvider for confirmation dialogs</li>
            <li>AuthProvider for permission checking</li>
          </ul>
          <p>
            In a real application, this component would show a "Delete" button when documents are
            selected, opening a confirmation modal with document counts and deletion options.
          </p>
        </div>
      </div>
    )
  },
}
