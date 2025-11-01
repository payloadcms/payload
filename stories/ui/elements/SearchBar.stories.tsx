import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { SearchBar } from '../../../packages/ui/src/elements/SearchBar'
import { Button } from '../../../packages/ui/src/elements/Button'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

const meta = {
  title: 'UI/Elements/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'SearchBar component for filtering and searching content in Payload CMS.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <div style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
          <Story />
        </div>
      </PayloadMockProviders>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    onSearchChange: {
      action: 'search changed',
      description: 'Function called when search value changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
} satisfies Meta<typeof SearchBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Search...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
}

export const CustomPlaceholder: Story = {
  args: {
    label: 'Find documents...',
    onSearchChange: (search: string) => console.log('Search:', search),
  },
}

export const WithActions: Story = {
  args: {
    label: 'Search with actions...',
    onSearchChange: (search: string) => console.log('Search:', search),
    Actions: [
      <Button key="filter" buttonStyle="secondary" size="small">
        Filter
      </Button>,
      <Button key="sort" buttonStyle="secondary" size="small">
        Sort
      </Button>,
    ],
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
        const filtered = mockData.filter(item =>
          item.toLowerCase().includes(search.toLowerCase())
        )
        setResults(filtered)
      } else {
        setResults([])
      }
    }
    
    return (
      <div style={{ width: '100%' }}>
        <SearchBar
          label="Search documents..."
          onSearchChange={handleSearchChange}
        />
        
        {searchTerm && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              Search Results for "{searchTerm}" ({results.length} found):
            </h4>
            {results.length > 0 ? (
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px',
                fontSize: '14px'
              }}>
                {results.map((result, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {result}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
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
        title: 'No Actions',
        Actions: undefined,
        label: 'Basic search...'
      },
      {
        title: 'Single Action',
        Actions: [
          <Button key="filter" buttonStyle="primary" size="small">
            Filter
          </Button>
        ],
        label: 'Search with filter...'
      },
      {
        title: 'Multiple Actions',
        Actions: [
          <Button key="filter" buttonStyle="secondary" size="small">
            Filter
          </Button>,
          <Button key="sort" buttonStyle="secondary" size="small">
            Sort
          </Button>,
          <Button key="export" buttonStyle="primary" size="small">
            Export
          </Button>,
        ],
        label: 'Search with multiple actions...'
      },
    ]
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {configurations.map((config, index) => (
          <div key={index}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              {config.title}
            </h4>
            <SearchBar
              label={config.label}
              Actions={config.Actions}
              onSearchChange={(search) => 
                setSearchResults(`Last search in ${config.title}: "${search}"`)
              }
            />
          </div>
        ))}
        
        {searchResults && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#e7f3ff',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
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
    label: 'Styled search bar...',
    className: 'custom-search-bar',
    onSearchChange: (search: string) => console.log('Custom styled search:', search),
    Actions: [
      <Button key="advanced" buttonStyle="pill" size="small">
        Advanced
      </Button>,
    ],
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
                key={collection.id}
                buttonStyle={selectedCollection === collection.id ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setSelectedCollection(collection.id)}
              >
                {collection.name} ({collection.count})
              </Button>
            ))}
          </div>
        </div>
        
        <SearchBar
          label={`Search ${collections.find(c => c.id === selectedCollection)?.name.toLowerCase()}...`}
          onSearchChange={setSearchTerm}
          Actions={[
            <Button key="create" buttonStyle="primary" size="small">
              Create New
            </Button>,
            <Button key="bulk" buttonStyle="secondary" size="small">
              Bulk Actions
            </Button>,
          ]}
        />
        
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Active Collection:</strong> {collections.find(c => c.id === selectedCollection)?.name}
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