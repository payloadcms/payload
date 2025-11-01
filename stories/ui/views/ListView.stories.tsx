import type { Meta, StoryObj } from '@storybook/react'
import type { ListViewClientProps } from 'payload'

import React from 'react'

// Import our HybridListView component that uses real Payload components
import { HybridListView } from './HybridListView'

// Import required styling
import '../../../packages/ui/src/views/List/index.scss'
import { mockCollectionConfig } from '../../_mocks/mockData'
// Import mock providers and utilities
import { MockTableColumnsProvider, PayloadMockProviders } from '../../_mocks/MockProviders'

// Create enhanced mock providers for ListView
const ListViewProviders = ({
  children,
  collectionSlug = 'pages',
}: {
  children: React.ReactNode
  collectionSlug?: string
}) => {
  return (
    <PayloadMockProviders>
      <MockTableColumnsProvider collectionSlug={collectionSlug}>
        <div style={{ background: 'var(--theme-bg)', minHeight: '100vh', padding: 'var(--base)' }}>
          {children}
        </div>
      </MockTableColumnsProvider>
    </PayloadMockProviders>
  )
}

// Mock data for ListView
const mockDocs = Array.from({ length: 5 }, (_, i) => ({
  id: `doc-${i + 1}`,
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  description: `This is a sample description for document ${i + 1}`,
  email: `user${i + 1}@example.com`,
  status: i % 2 === 0 ? 'published' : 'draft',
  title: `Document ${i + 1}`,
  updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
}))

// Mock Table component that matches real Payload exactly
const MockTable = () => (
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          <th>
            <input aria-label="select-all" className="checkbox" type="checkbox" />
          </th>
          <th>Title</th>
          <th>Content</th>
          <th>Updated At</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input className="checkbox" type="checkbox" />
          </td>
          <td>
            <a href="#">example post</a>
          </td>
          <td>&lt;No Content&gt;</td>
          <td>November 1st 2025, 2:36 PM</td>
          <td>November 1st 2025, 2:36 PM</td>
        </tr>
      </tbody>
    </table>
  </div>
)

// Create comprehensive mock props
const createMockProps = (overrides: Partial<ListViewClientProps> = {}): ListViewClientProps => ({
  AfterList: null,
  AfterListTable: null,
  beforeActions: [],
  BeforeList: null,
  BeforeListTable: null,
  collectionSlug: 'pages',
  columnState: {
    columns: [
      { accessor: 'title', active: true },
      { accessor: 'status', active: true },
      { accessor: 'createdAt', active: true },
      { accessor: 'updatedAt', active: true },
    ],
  },
  Description: () => (
    <div>
      <p>Manage your pages collection. Create, edit, and organize your content.</p>
    </div>
  ),
  disableBulkDelete: false,
  disableBulkEdit: false,
  disableQueryPresets: false,
  enableRowSelections: true,
  hasCreatePermission: true,
  hasDeletePermission: true,
  listMenuItems: [],
  newDocumentURL: '/admin/collections/pages/create',
  queryPreset: undefined,
  queryPresetPermissions: {},
  renderedFilters: null,
  resolvedFilterOptions: [],
  Table: MockTable,
  viewType: 'default',
  ...overrides,
})

const meta: Meta<typeof HybridListView> = {
  component: HybridListView,
  decorators: [
    (Story, context) => (
      <ListViewProviders collectionSlug={context.args?.collectionSlug || 'pages'}>
        <Story />
      </ListViewProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Hybrid ListView component that uses real Payload components (ListHeader, ListControls) with authentic styling and behavior.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'UI/Views/ListView',
}

export default meta
type Story = StoryObj<typeof HybridListView>

export const Default: Story = {
  args: createMockProps({
    Description: undefined,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default list view with standard collection configuration showing pages with typical fields and actions.',
      },
    },
  },
}

export const WithDocuments: Story = {
  args: createMockProps(),
  parameters: {
    docs: {
      description: {
        story:
          'List view populated with sample documents showing the table layout and document metadata.',
      },
    },
  },
}

export const WithCustomDescription: Story = {
  args: createMockProps({
    Description: () => (
      <div className="collection-description">
        <h3>Custom Collection Description</h3>
        <p>This collection contains custom content with special handling and business logic.</p>
        <div className="collection-stats">
          <span className="stat">Total: 125</span>
          <span className="stat">Published: 98</span>
          <span className="stat">Draft: 27</span>
        </div>
      </div>
    ),
  }),
  parameters: {
    docs: {
      description: {
        story:
          'List view with a custom description component showing additional collection metadata and statistics.',
      },
    },
  },
}

export const UploadCollection: Story = {
  args: createMockProps({
    collectionSlug: 'media',
    Description: () => (
      <div>
        <p>Manage your media files. Upload, organize, and optimize your images and documents.</p>
      </div>
    ),
  }),
  parameters: {
    docs: {
      description: {
        story: 'List view configured for an upload collection with file management capabilities.',
      },
    },
  },
}

export const TrashView: Story = {
  args: createMockProps({
    Description: () => (
      <div>
        <p>Items that have been deleted. You can restore or permanently delete them from here.</p>
      </div>
    ),
    viewType: 'trash',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Trash view showing deleted items with restore and permanent deletion options.',
      },
    },
  },
}

export const NoPermissions: Story = {
  args: createMockProps({
    disableBulkDelete: true,
    disableBulkEdit: true,
    hasCreatePermission: false,
    hasDeletePermission: false,
  }),
  parameters: {
    docs: {
      description: {
        story: 'List view with restricted permissions - no create, edit, or delete capabilities.',
      },
    },
  },
}

export const WithBeforeAfterComponents: Story = {
  args: createMockProps({
    AfterList: (
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          borderRadius: 'var(--base-border-radius)',
          padding: 'var(--base)',
        }}
      >
        <p>
          <strong>After List Component:</strong> Additional content that appears after the list
          interface.
        </p>
      </div>
    ),
    AfterListTable: (
      <div
        style={{
          background: 'var(--theme-elevation-100)',
          marginTop: 'var(--base)',
          padding: 'var(--base)',
        }}
      >
        <p>
          <strong>After Table:</strong> Content that appears just after the data table.
        </p>
      </div>
    ),
    BeforeList: (
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          borderRadius: 'var(--base-border-radius)',
          padding: 'var(--base)',
        }}
      >
        <p>
          <strong>Before List Component:</strong> Custom content that appears before the list
          interface.
        </p>
      </div>
    ),
    BeforeListTable: (
      <div
        style={{
          background: 'var(--theme-elevation-100)',
          marginBottom: 'var(--base)',
          padding: 'var(--base)',
        }}
      >
        <p>
          <strong>Before Table:</strong> Content that appears just before the data table.
        </p>
      </div>
    ),
  }),
  parameters: {
    docs: {
      description: {
        story:
          'List view demonstrating the before/after component slots for custom content insertion.',
      },
    },
  },
}

export const ResponsiveBreakpoint: Story = {
  args: createMockProps(),
  parameters: {
    docs: {
      description: {
        story: 'List view at mobile breakpoint showing responsive behavior and layout adjustments.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
