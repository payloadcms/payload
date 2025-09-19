/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { ViewDescription } from './index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof ViewDescription> = {
  args: {
    description: 'This is a view description',
  },
  argTypes: {
    description: {
      control: 'text',
      description: 'Description text or component to display',
    },
  },
  component: ViewDescription,
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
        component: 'A view description component that displays description text or components.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/ViewDescription',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    description: 'This is a basic view description',
  },
}

export const LongDescription: Story = {
  args: {
    description:
      'This is a much longer view description that provides more detailed information about the current view or section. It can contain multiple sentences and should be displayed properly with appropriate styling.',
  },
}

export const WithHTML: Story = {
  args: {
    description:
      'This description contains <strong>bold text</strong> and <em>italic text</em> to demonstrate HTML formatting.',
  },
}

export const EmptyDescription: Story = {
  args: {
    description: '',
  },
}

export const UndefinedDescription: Story = {
  args: {
    description: undefined,
  },
}

// In context examples
export const InViewHeader: Story = {
  parameters: {
    docs: {
      description: {
        story: 'ViewDescription component in a view header context.',
      },
    },
  },
  render: () => (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      <div
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '20px' }}
      >
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>Documents</h1>
        <ViewDescription description="Manage and organize your documents in this view. You can create, edit, and delete documents as needed." />
      </div>
      <div style={{ padding: '20px' }}>
        <p>Main content area...</p>
      </div>
    </div>
  ),
}

export const InFormSection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'ViewDescription component in a form section context.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '500px', width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>User Settings</h2>
        <ViewDescription description="Configure your user preferences and account settings below." />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="display-name"
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}
          >
            Display Name
          </label>
          <input
            id="display-name"
            placeholder="Enter your display name"
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px 12px',
              width: '100%',
            }}
            type="text"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="email"
            placeholder="Enter your email"
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px 12px',
              width: '100%',
            }}
            type="email"
          />
        </div>
      </div>
    </div>
  ),
}

export const InCard: Story = {
  parameters: {
    docs: {
      description: {
        story: 'ViewDescription component in a card context.',
      },
    },
  },
  render: () => (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '18px', margin: '0 0 12px 0' }}>API Configuration</h3>
      <ViewDescription description="Set up your API endpoints and authentication settings. These configurations will be used across your application." />

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          style={{
            backgroundColor: '#0066cc',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
          type="button"
        >
          Configure
        </button>
        <button
          style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: '#333',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  ),
}

export const InModal: Story = {
  parameters: {
    docs: {
      description: {
        story: 'ViewDescription component in a modal context.',
      },
    },
  },
  render: () => (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        left: 0,
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxHeight: '80vh',
          maxWidth: '500px',
          overflow: 'auto',
          padding: '24px',
          width: '90%',
        }}
      >
        <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Delete Document</h2>
        <ViewDescription description="Are you sure you want to delete this document? This action cannot be undone and will permanently remove the document from your system." />

        <div
          style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}
        >
          <button
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: '#333',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
            type="button"
          >
            Cancel
          </button>
          <button
            style={{
              backgroundColor: '#dc3545',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ),
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available view description variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Basic descriptions */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Basic Descriptions</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Short Description</h4>
            <ViewDescription description="A brief description" />
          </div>

          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Long Description</h4>
            <ViewDescription description="This is a much longer description that provides more detailed information about the current view or section. It can contain multiple sentences and should be displayed properly with appropriate styling and formatting." />
          </div>
        </div>
      </div>

      {/* Different content types */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Different Content Types</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Plain Text</h4>
            <ViewDescription description="Simple plain text description" />
          </div>

          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>HTML Content</h4>
            <ViewDescription description="Description with <strong>bold</strong> and <em>italic</em> text" />
          </div>
        </div>
      </div>

      {/* Edge cases */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Edge Cases</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Empty Description</h4>
            <ViewDescription description="" />
            <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
              No content rendered
            </p>
          </div>

          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Undefined Description</h4>
            <ViewDescription description={undefined} />
            <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
              No content rendered
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
}
