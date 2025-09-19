import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { TableColumnContext } from '../../providers/TableColumns/context.js'
import { ColumnSelector } from './index.js'

const meta: Meta<typeof ColumnSelector> = {
  component: ColumnSelector,
  parameters: {
    docs: {
      description: {
        component:
          'A component that provides an interactive interface for selecting and reordering table columns in PayloadCMS.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/ColumnSelector',
}

export default meta

type Story = StoryObj<typeof ColumnSelector>

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

// Mock column data for the story
const initialColumns = [
  {
    accessor: 'id',
    active: true,
    field: {
      name: 'id',
      type: 'text',
      label: 'ID',
    },
    Heading: null,
    renderedCells: [],
  },
  {
    accessor: 'title',
    active: true,
    field: {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    Heading: null,
    renderedCells: [],
  },
  {
    accessor: 'publishedDate',
    active: false,
    field: {
      name: 'publishedDate',
      type: 'date',
      label: 'Published Date',
    },
    Heading: null,
    renderedCells: [],
  },
  {
    accessor: 'status',
    active: true,
    field: {
      name: 'status',
      type: 'select',
      label: 'Status',
    },
    Heading: null,
    renderedCells: [],
  },
]

// Custom provider that uses local state
const MockTableColumnsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [columns, setColumns] = useState(initialColumns)

  const toggleColumn = (columnAccessor: string): Promise<void> => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.accessor === columnAccessor ? { ...col, active: !col.active } : col,
      ),
    )
    return Promise.resolve()
  }

  const moveColumn = ({
    fromIndex,
    toIndex,
  }: {
    fromIndex: number
    toIndex: number
  }): Promise<void> => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]
      const [movedColumn] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, movedColumn)
      return newColumns
    })
    return Promise.resolve()
  }

  const setActiveColumns = (_columns: string[]): Promise<void> => {
    // No-op for story
    return Promise.resolve()
  }

  const resetColumnsState = (): Promise<void> => {
    setColumns(initialColumns)
    return Promise.resolve()
  }

  return (
    <TableColumnContext
      value={{
        columns: columns as any,
        LinkedCellOverride: undefined,
        moveColumn,
        resetColumnsState,
        setActiveColumns,
        toggleColumn,
      }}
    >
      {children}
    </TableColumnContext>
  )
}

// Wrapper component to manage column state
const ColumnSelectorWithState: React.FC = () => {
  return (
    <EditDepthProvider>
      <MockTableColumnsProvider>
        <div style={containerStyles}>
          <ColumnSelector collectionSlug="posts" />
          <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px' }}>
            Try clicking pills to toggle columns or dragging to reorder them.
          </div>
        </div>
      </MockTableColumnsProvider>
    </EditDepthProvider>
  )
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of ColumnSelector showing draggable column pills for the posts collection.',
      },
    },
  },
  render: () => <ColumnSelectorWithState />,
}
