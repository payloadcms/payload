import type { Meta, StoryObj } from '@storybook/react'
import type { ListViewClientProps } from 'payload'

import React from 'react'

// Import the REAL Payload ListView component
import { DefaultListView } from '../../../packages/ui/src/views/List/index'

// Import mock providers and utilities
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Create enhanced mock providers for real ListView
const RealListViewProviders = ({
  children,
  collectionSlug = 'posts',
}: {
  children: React.ReactNode
  collectionSlug?: string
}) => {
  return (
    <PayloadMockProviders>
      <div style={{ background: 'var(--theme-bg)', minHeight: '100vh', padding: 'var(--base)' }}>
        {children}
      </div>
    </PayloadMockProviders>
  )
}

// Create realistic mock props for real ListView
const createRealMockProps = (
  overrides: Partial<ListViewClientProps> = {},
): ListViewClientProps => ({
  AfterList: null,
  AfterListTable: null,
  beforeActions: [],
  BeforeList: null,
  BeforeListTable: null,
  collectionSlug: 'posts',
  columnState: {
    columns: [
      { accessor: 'title', active: true },
      { accessor: 'content', active: true },
      { accessor: 'updatedAt', active: true },
      { accessor: 'createdAt', active: true },
    ],
  },
  Description: undefined,
  disableBulkDelete: false,
  disableBulkEdit: false,
  disableQueryPresets: false,
  enableRowSelections: true,
  hasCreatePermission: true,
  hasDeletePermission: true,
  listMenuItems: [],
  newDocumentURL: '/admin/collections/posts/create',
  queryPreset: undefined,
  queryPresetPermissions: {},
  renderedFilters: null,
  resolvedFilterOptions: [],
  Table: undefined, // Let the real component handle the table
  viewType: 'default',
  ...overrides,
})

const meta: Meta<typeof DefaultListView> = {
  component: DefaultListView,
  decorators: [
    (Story, context) => (
      <RealListViewProviders collectionSlug={context.args?.collectionSlug || 'posts'}>
        <Story />
      </RealListViewProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Real Payload DefaultListView component using actual Payload components and styling.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'UI/Views/RealListView',
}

export default meta
type Story = StoryObj<typeof DefaultListView>

export const Default: Story = {
  args: createRealMockProps(),
  parameters: {
    docs: {
      description: {
        story:
          'Default list view using the real Payload DefaultListView component with authentic styling and behavior.',
      },
    },
  },
}
