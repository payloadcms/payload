import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { SearchBar } from '../../../packages/ui/src/elements/SearchBar'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    label: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    onSearchChange: {
      action: 'search changed',
      description: 'Function called when search value changes',
    },
  },
  component: SearchBar,
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div
          style={{
            background: 'var(--theme-bg)',
            maxWidth: '600px',
            padding: '4px',
            width: '100%',
          }}
        >
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'SearchBar component for filtering and searching content in Payload CMS.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Elements/SearchBar',
} satisfies Meta<typeof SearchBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Search...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
}

export const MinimalPadding: Story = {
  args: {
    label: 'Search with minimal padding...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ background: 'var(--theme-bg)', maxWidth: '600px', width: '100%' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
}

export const CustomPlaceholder: Story = {
  args: {
    label: 'Find documents...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
}

export const WithActions: Story = {
  args: {
    Actions: [
      <Button buttonStyle="secondary" key="filter" size="small">
        Filter
      </Button>,
      <Button buttonStyle="secondary" key="sort" size="small">
        Sort
      </Button>,
    ],
    label: 'Search with actions...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
}

// Interactive search bar with live results
export const LiveSearch: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [results, setResults] = useState<string[]>([])

    // Mock data for search
    const mockData = [
      'Home Page',
      'About Us',
      'Contact Form',
      'Blog Posts',
      'User Dashboard',
      'Product Catalog',
      'Settings Panel',
      'Admin Tools',
      'Documentation',
      'Help Center',
    ]

    const handleSearchChange = (search: string) => {
      setSearchTerm(search)

      if (search.length > 0) {
        const filtered = mockData.filter((item) =>
          item.toLowerCase().includes(search.toLowerCase()),
        )
        setResults(filtered)
      } else {
        setResults([])
      }
    }

    return (
      <div style={{ width: '100%' }}>
        <SearchBar label="Search documents..." onSearchChange={handleSearchChange} />

        {searchTerm && (
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-50)',
              borderRadius: '4px',
              marginTop: '16px',
              padding: '12px',
            }}
          >
            <h4 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>
              Search Results for "{searchTerm}" ({results.length} found):
            </h4>
            {results.length > 0 ? (
              <ul
                style={{
                  fontSize: '14px',
                  margin: 0,
                  paddingLeft: '20px',
                }}
              >
                {results.map((result, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {result}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--theme-elevation-400)', fontSize: '14px', margin: 0 }}>
                No results found
              </p>
            )}
          </div>
        )}
      </div>
    )
  },
}

// Search bar with different action configurations
export const VariousActions: Story = {
  render: () => {
    const [searchResults, setSearchResults] = useState('')

    const configurations = [
      {
        Actions: undefined,
        label: 'Basic search...',
        title: 'No Actions',
      },
      {
        Actions: [
          <Button buttonStyle="primary" key="filter" size="small">
            Filter
          </Button>,
        ],
        label: 'Search with filter...',
        title: 'Single Action',
      },
      {
        Actions: [
          <Button buttonStyle="secondary" key="filter" size="small">
            Filter
          </Button>,
          <Button buttonStyle="secondary" key="sort" size="small">
            Sort
          </Button>,
          <Button buttonStyle="primary" key="export" size="small">
            Export
          </Button>,
        ],
        label: 'Search with multiple actions...',
        title: 'Multiple Actions',
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {configurations.map((config, index) => (
          <div key={index}>
            <h4 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>{config.title}</h4>
            <SearchBar
              Actions={config.Actions}
              label={config.label}
              onSearchChange={(search) =>
                setSearchResults(`Last search in ${config.title}: "${search}"`)
              }
            />
          </div>
        ))}

        {searchResults && (
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-50)',
              borderRadius: '4px',
              fontSize: '14px',
              marginTop: '16px',
              padding: '12px',
            }}
          >
            {searchResults}
          </div>
        )}
      </div>
    )
  },
}

// Search bar with custom styling
export const CustomStyling: Story = {
  args: {
    Actions: [
      <Button buttonStyle="pill" key="advanced" size="small">
        Advanced
      </Button>,
    ],
    className: 'custom-search-bar',
    label: 'Styled search bar...',
    onSearchChange: (search: string) => console.log('Custom styled search:', search),
  },
}

// Simulated collection search interface
export const CollectionSearch: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCollection, setSelectedCollection] = useState('pages')

    const collections = [
      { id: 'pages', name: 'Pages', count: 24 },
      { id: 'posts', name: 'Blog Posts', count: 156 },
      { id: 'users', name: 'Users', count: 89 },
      { id: 'media', name: 'Media', count: 342 },
    ]

    return (
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Collection Management</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {collections.map((collection) => (
              <Button
                buttonStyle={selectedCollection === collection.id ? 'primary' : 'secondary'}
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                size="small"
              >
                {collection.name} ({collection.count})
              </Button>
            ))}
          </div>
        </div>

        <SearchBar
          Actions={[
            <Button buttonStyle="primary" key="create" size="small">
              Create New
            </Button>,
            <Button buttonStyle="secondary" key="bulk" size="small">
              Bulk Actions
            </Button>,
          ]}
          label={`Search ${collections.find((c) => c.id === selectedCollection)?.name.toLowerCase()}...`}
          onSearchChange={setSearchTerm}
        />

        <div
          style={{
            backgroundColor: 'var(--theme-elevation-50)',
            borderRadius: '4px',
            fontSize: '14px',
            marginTop: '16px',
            padding: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Active Collection:</strong>{' '}
            {collections.find((c) => c.id === selectedCollection)?.name}
          </p>
          {searchTerm && (
            <p style={{ margin: 0 }}>
              <strong>Search Query:</strong> "{searchTerm}"
            </p>
          )}
        </div>
      </div>
    )
  },
}

// Payload-style collection header context
export const InCollectionHeader: Story = {
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
      {/* Mock collection header */}
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid var(--theme-border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <h2 style={{ fontSize: '18px', margin: 0 }}>Pages Collection</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button buttonStyle="primary" size="small">
            Create New
          </Button>
        </div>
      </div>

      {/* Search bar in typical context */}
      <div style={{ padding: '16px 20px' }}>
        <SearchBar
          Actions={[
            <Button buttonStyle="secondary" key="filter" size="small">
              Filter
            </Button>,
            <Button buttonStyle="secondary" key="sort" size="small">
              Sort
            </Button>,
          ]}
          label="Search pages..."
          onSearchChange={(search) => console.log('Collection search:', search)}
        />
      </div>

      {/* Mock table header to show context */}
      <div
        style={{
          background: 'var(--theme-elevation-100)',
          borderTop: '1px solid var(--theme-border-color)',
          display: 'grid',
          fontSize: '12px',
          fontWeight: '600',
          gridTemplateColumns: '40px 1fr 120px 100px',
          padding: '12px 20px',
          textTransform: 'uppercase',
        }}
      >
        <div>ID</div>
        <div>Title</div>
        <div>Status</div>
        <div>Updated</div>
      </div>
    </div>
  ),
}
