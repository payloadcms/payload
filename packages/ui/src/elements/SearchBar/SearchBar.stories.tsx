/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'
import { SearchBar } from './index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof SearchBar> = {
  args: {
    onSearchChange: (search: string) => {
      // Search changed: search
    },
  },
  argTypes: {
    Actions: {
      control: false,
      description: 'Array of action components to display',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    label: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    onSearchChange: {
      action: 'searchChanged',
      description: 'Function called when search input changes',
    },
    searchQueryParam: {
      control: 'text',
      description: 'Query parameter name for URL persistence',
    },
  },
  component: SearchBar,
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
        component: 'A search bar component with input field and optional actions.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/SearchBar',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    label: 'Search...',
  },
}

export const WithCustomLabel: Story = {
  args: {
    label: 'Find documents...',
  },
}

export const WithQueryParam: Story = {
  args: {
    label: 'Search with URL persistence',
    searchQueryParam: 'q',
  },
}

// With actions
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
    label: 'Search with actions',
  },
}

export const WithSingleAction: Story = {
  args: {
    Actions: [
      <Button buttonStyle="error" key="clear" size="small">
        Clear
      </Button>,
    ],
    label: 'Search with clear action',
  },
}

export const WithMultipleActions: Story = {
  args: {
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
    label: 'Search with multiple actions',
  },
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')
    const [searchHistory, setSearchHistory] = useState<string[]>([])

    const handleSearchChange = (search: string) => {
      setSearchValue(search)
      if (search && !searchHistory.includes(search)) {
        setSearchHistory((prev) => [search, ...prev.slice(0, 4)])
      }
    }

    const clearSearch = () => {
      setSearchValue('')
    }

    return (
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <SearchBar
          Actions={[
            <Button buttonStyle="secondary" key="clear" onClick={clearSearch} size="small">
              Clear
            </Button>,
          ]}
          label="Type to search..."
          onSearchChange={handleSearchChange}
        />

        {searchValue && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              marginTop: '16px',
              padding: '12px',
            }}
          >
            <strong>Current search:</strong> {searchValue}
          </div>
        )}

        {searchHistory.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <strong>Recent searches:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {searchHistory.map((term, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  <button
                    onClick={() => setSearchValue(term)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0066cc',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    type="button"
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  },
}

// Different sizes and layouts
export const FullWidth: Story = {
  render: (args) => (
    <div style={{ width: '100%' }}>
      <SearchBar {...args} />
    </div>
  ),
}

export const NarrowWidth: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
      <SearchBar {...args} />
    </div>
  ),
}

// With custom styling
export const WithCustomClassName: Story = {
  args: {
    className: 'custom-search-bar',
    label: 'Custom styled search',
  },
}

// Multiple search bars
export const MultipleSearchBars: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of multiple search bars with different configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Basic Search</h3>
        <SearchBar
          label="Search documents..."
          onSearchChange={(search) => {
            // Basic search: search
          }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '8px' }}>With Actions</h3>
        <SearchBar
          Actions={[
            <Button buttonStyle="secondary" key="filter" size="small">
              Filter
            </Button>,
            <Button buttonStyle="secondary" key="sort" size="small">
              Sort
            </Button>,
          ]}
          label="Search with actions..."
          onSearchChange={(search) => {
            // With actions search: search
          }}
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '8px' }}>With URL Persistence</h3>
        <SearchBar
          label="Search with URL persistence..."
          onSearchChange={(search) => {
            // URL persistent search: search
          }}
          searchQueryParam="search"
        />
      </div>

      <div>
        <h3 style={{ marginBottom: '8px' }}>Custom Label</h3>
        <SearchBar
          label="Find anything you're looking for..."
          onSearchChange={(search) => {
            // Custom label search: search
          }}
        />
      </div>
    </div>
  ),
}
