import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Pagination } from '../elements/Pagination/index.js'

// Global styles are imported in .storybook/preview.ts

const meta: Meta<typeof Pagination> = {
  args: {
    page: 1,
    totalPages: 10,
  },
  argTypes: {
    hasNextPage: {
      control: 'boolean',
      description: 'Whether there is a next page available',
    },
    hasPrevPage: {
      control: 'boolean',
      description: 'Whether there is a previous page available',
    },
    limit: {
      control: { type: 'number', max: 100, min: 1 },
      description: 'Number of items per page',
    },
    nextPage: {
      control: { type: 'number', min: 1 },
      description: 'Next page number',
    },
    numberOfNeighbors: {
      control: { type: 'number', max: 5, min: 0 },
      description: 'Number of page neighbors to show around current page',
    },
    onChange: {
      action: 'pageChanged',
      description: 'Function called when page changes',
    },
    page: {
      control: { type: 'number', min: 1 },
      description: 'Current page number',
    },
    prevPage: {
      control: { type: 'number', min: 1 },
      description: 'Previous page number',
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages',
    },
  },
  component: Pagination,
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
        component: 'A pagination component that displays page navigation controls.',
      },
    },
    layout: 'centered',
  },
  title: 'Elements/Pagination',
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Basic: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: false,
    page: 1,
    totalPages: 10,
  },
}

export const MiddlePage: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 5,
    totalPages: 10,
  },
}

export const LastPage: Story = {
  args: {
    hasNextPage: false,
    hasPrevPage: true,
    page: 10,
    totalPages: 10,
  },
}

export const SinglePage: Story = {
  args: {
    hasNextPage: false,
    hasPrevPage: false,
    page: 1,
    totalPages: 1,
  },
}

// Different page counts
export const FewPages: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 2,
    totalPages: 3,
  },
}

export const ManyPages: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 15,
    totalPages: 50,
  },
}

export const VeryManyPages: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 100,
    totalPages: 1000,
  },
}

// Different neighbors
export const NoNeighbors: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    numberOfNeighbors: 0,
    page: 5,
    totalPages: 10,
  },
}

export const ManyNeighbors: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    numberOfNeighbors: 3,
    page: 5,
    totalPages: 20,
  },
}

// Edge cases
export const FirstPage: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: false,
    page: 1,
    totalPages: 10,
  },
}

export const SecondPage: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 2,
    totalPages: 10,
  },
}

export const SecondToLastPage: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 9,
    totalPages: 10,
  },
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = 20

    const handlePageChange = (page: number) => {
      setCurrentPage(page)
    }

    const hasNextPage = currentPage < totalPages
    const hasPrevPage = currentPage > 1

    return (
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h3>Interactive Pagination</h3>
          <p>
            Current page: {currentPage} of {totalPages}
          </p>
        </div>

        <Pagination
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          nextPage={hasNextPage ? currentPage + 1 : null}
          onChange={handlePageChange}
          page={currentPage}
          prevPage={hasPrevPage ? currentPage - 1 : null}
          totalPages={totalPages}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(1)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Last
          </button>
        </div>
      </div>
    )
  },
}

// Different configurations
export const WithCustomNeighbors: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    numberOfNeighbors: 2,
    page: 10,
    totalPages: 50,
  },
}

export const WithLimit: Story = {
  args: {
    hasNextPage: true,
    hasPrevPage: true,
    limit: 25,
    page: 3,
    totalPages: 10,
  },
}

// All variants showcase
export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A showcase of all available pagination variants and configurations.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Basic pagination */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Basic Pagination</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>First Page</p>
            <Pagination hasNextPage={true} hasPrevPage={false} page={1} totalPages={10} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Middle Page</p>
            <Pagination hasNextPage={true} hasPrevPage={true} page={5} totalPages={10} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Last Page</p>
            <Pagination hasNextPage={false} hasPrevPage={true} page={10} totalPages={10} />
          </div>
        </div>
      </div>

      {/* Different page counts */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Different Page Counts</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Few Pages (3)</p>
            <Pagination hasNextPage={true} hasPrevPage={true} page={2} totalPages={3} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Many Pages (20)</p>
            <Pagination hasNextPage={true} hasPrevPage={true} page={10} totalPages={20} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Very Many Pages (100)</p>
            <Pagination hasNextPage={true} hasPrevPage={true} page={50} totalPages={100} />
          </div>
        </div>
      </div>

      {/* Different neighbors */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Different Neighbors</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>No Neighbors</p>
            <Pagination
              hasNextPage={true}
              hasPrevPage={true}
              numberOfNeighbors={0}
              page={5}
              totalPages={20}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>1 Neighbor</p>
            <Pagination
              hasNextPage={true}
              hasPrevPage={true}
              numberOfNeighbors={1}
              page={5}
              totalPages={20}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>2 Neighbors</p>
            <Pagination
              hasNextPage={true}
              hasPrevPage={true}
              numberOfNeighbors={2}
              page={5}
              totalPages={20}
            />
          </div>
        </div>
      </div>

      {/* Edge cases */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Edge Cases</h3>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Single Page</p>
            <Pagination hasNextPage={false} hasPrevPage={false} page={1} totalPages={1} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Two Pages</p>
            <Pagination hasNextPage={true} hasPrevPage={false} page={1} totalPages={2} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Second Page</p>
            <Pagination hasNextPage={false} hasPrevPage={true} page={2} totalPages={2} />
          </div>
        </div>
      </div>
    </div>
  ),
}
