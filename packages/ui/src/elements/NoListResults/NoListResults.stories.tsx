/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../Button/index.js'
import { NoListResults } from '../NoListResults/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof NoListResults> = {
  args: {
    Message: 'No results found',
  },
  argTypes: {
    Actions: {
      control: false,
      description: 'Array of action components to display',
    },
    Message: {
      control: 'text',
      description: 'Message to display when no results are found',
    },
  },
  component: NoListResults,
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
          'A component that displays when no results are found in a list, with optional actions.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/NoListResults',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    Message: 'No results found',
  },
}

export const WithCustomMessage: Story = {
  args: {
    Message: 'No documents match your search criteria',
  },
}

export const WithRichMessage: Story = {
  args: {
    Message: (
      <div>
        <h3 style={{ margin: '0 0 8px 0' }}>No Results Found</h3>
        <p style={{ color: '#666', margin: '0 0 8px 0' }}>
          We couldn't find any documents that match your search criteria.
        </p>
        <p style={{ color: '#666', margin: 0 }}>Try adjusting your filters or search terms.</p>
      </div>
    ),
  },
}

// With actions
export const WithSingleAction: Story = {
  args: {
    Actions: [
      <Button buttonStyle="primary" key="create">
        Create New Document
      </Button>,
    ],
    Message: 'No documents found',
  },
}

export const WithMultipleActions: Story = {
  args: {
    Actions: [
      <Button buttonStyle="primary" key="create">
        Create New
      </Button>,
      <Button buttonStyle="secondary" key="import">
        Import Data
      </Button>,
    ],
    Message: 'No documents found',
  },
}

export const WithManyActions: Story = {
  args: {
    Actions: [
      <Button buttonStyle="primary" key="create">
        Create New
      </Button>,
      <Button buttonStyle="secondary" key="import">
        Import
      </Button>,
      <Button buttonStyle="subtle" key="refresh">
        Refresh
      </Button>,
    ],
    Message: 'No documents found',
  },
}

// Different message types
export const EmptyState: Story = {
  args: {
    Message: 'This collection is empty',
  },
}

export const SearchNoResults: Story = {
  args: {
    Message: 'No results found for "search term"',
  },
}

export const FilterNoResults: Story = {
  args: {
    Message: 'No documents match the selected filters',
  },
}

export const ErrorState: Story = {
  args: {
    Message: 'Unable to load documents. Please try again.',
  },
}

// With different action styles
export const WithDifferentActionStyles: Story = {
  args: {
    Actions: [
      <Button buttonStyle="primary" key="primary">
        Primary Action
      </Button>,
      <Button buttonStyle="secondary" key="secondary">
        Secondary Action
      </Button>,
      <Button buttonStyle="subtle" key="subtle">
        Subtle Action
      </Button>,
      <Button buttonStyle="error" key="error">
        Error Action
      </Button>,
    ],
    Message: 'No results with different action styles',
  },
}

// Complex examples
export const FullFeatured: Story = {
  args: {
    Actions: [
      <Button buttonStyle="primary" icon="plus" key="create">
        Create New Document
      </Button>,
      <Button buttonStyle="secondary" icon="upload" key="import">
        Import Documents
      </Button>,
    ],
    Message: (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          <span aria-label="Document icon" role="img">
            📄
          </span>
        </div>
        <h3 style={{ margin: '0 0 8px 0' }}>No Documents Found</h3>
        <p style={{ color: '#666', margin: '0 0 16px 0' }}>
          This collection doesn't have any documents yet.
        </p>
        <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
          Create your first document or import existing data to get started.
        </p>
      </div>
    ),
  },
}

export const SearchResults: Story = {
  args: {
    Actions: [
      <Button buttonStyle="secondary" key="clear">
        Clear Search
      </Button>,
      <Button buttonStyle="primary" key="new">
        Create New
      </Button>,
    ],
    Message: (
      <div>
        <h3 style={{ margin: '0 0 8px 0' }}>No Search Results</h3>
        <p style={{ color: '#666', margin: '0 0 8px 0' }}>
          No documents match your search for <strong>"example search"</strong>
        </p>
        <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
          Try different keywords or check your spelling.
        </p>
      </div>
    ),
  },
}

// In context examples
export const InListContext: Story = {
  parameters: {
    docs: {
      description: {
        story: 'NoListResults component in a list context with proper styling.',
      },
    },
  },
  render: () => (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      {/* List header */}
      <div
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '16px' }}
      >
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Documents</h2>
          <Button buttonStyle="primary" size="small">
            Create New
          </Button>
        </div>
      </div>

      {/* No results state */}
      <div style={{ padding: '40px 20px' }}>
        <NoListResults
          Actions={[
            <Button buttonStyle="primary" key="create">
              Create First Document
            </Button>,
            <Button buttonStyle="secondary" key="import">
              Import Data
            </Button>,
          ]}
          Message={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                <span aria-label="Document icon" role="img">
                  📄
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>No Documents Yet</h3>
              <p style={{ color: '#666', margin: 0 }}>
                Get started by creating your first document or importing existing data.
              </p>
            </div>
          }
        />
      </div>
    </div>
  ),
}

export const InSearchContext: Story = {
  parameters: {
    docs: {
      description: {
        story: 'NoListResults component in a search context.',
      },
    },
  },
  render: () => (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Search header */}
      <div
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '16px' }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
          <input
            aria-label="Search documents"
            placeholder="Search documents..."
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              flex: 1,
              padding: '8px 12px',
            }}
            value="example search"
          />
          <Button buttonStyle="secondary" size="small">
            Clear
          </Button>
        </div>
      </div>

      {/* No results state */}
      <div style={{ padding: '40px 20px' }}>
        <NoListResults
          Actions={[
            <Button buttonStyle="secondary" key="clear">
              Clear Search
            </Button>,
            <Button buttonStyle="primary" key="create">
              Create New
            </Button>,
          ]}
          Message={
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                <span aria-label="Search icon" role="img">
                  🔍
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>No Results Found</h3>
              <p style={{ color: '#666', margin: '0 0 8px 0' }}>
                No documents match your search for <strong>"example search"</strong>
              </p>
              <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                Try different keywords or check your spelling.
              </p>
            </div>
          }
        />
      </div>
    </div>
  ),
}

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available NoListResults variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Basic messages */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Basic Messages</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <NoListResults Message="No results found" />
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <NoListResults Message="No documents found" />
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <NoListResults Message="This collection is empty" />
          </div>
        </div>
      </div>

      {/* With actions */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>With Actions</h3>
        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}
        >
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <NoListResults
              Actions={[<Button key="create">Create New</Button>]}
              Message="No documents found"
            />
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <NoListResults
              Actions={[
                <Button buttonStyle="primary" key="create">
                  Create
                </Button>,
                <Button buttonStyle="secondary" key="import">
                  Import
                </Button>,
              ]}
              Message="No documents found"
            />
          </div>
        </div>
      </div>

      {/* Rich content */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Rich Content</h3>
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
          <NoListResults
            Actions={[
              <Button buttonStyle="primary" icon="plus" key="create">
                Create First Document
              </Button>,
              <Button buttonStyle="secondary" icon="upload" key="import">
                Import Data
              </Button>,
            ]}
            Message={
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  <span aria-label="Document icon" role="img">
                    📄
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0' }}>No Documents Yet</h3>
                <p style={{ color: '#666', margin: '0 0 8px 0' }}>
                  This collection doesn't have any documents yet.
                </p>
                <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
                  Create your first document or import existing data to get started.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  ),
}
