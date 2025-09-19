import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { ArrayAction } from './index.js'

const meta: Meta<typeof ArrayAction> = {
  argTypes: {
    addRow: { action: 'addRow' },
    copyRow: { action: 'copyRow' },
    duplicateRow: { action: 'duplicateRow' },
    moveRow: { action: 'moveRow' },
    pasteRow: { action: 'pasteRow' },
    removeRow: { action: 'removeRow' },
  },
  component: ArrayAction,
  parameters: {
    payloadContext: true,
  },
  title: 'Elements/ArrayAction',
}

export default meta

type Story = StoryObj<typeof ArrayAction>

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example showing how ArrayAction is used within array field rows. Each row has a three-dot menu that provides context-sensitive actions based on the row position. Try the different actions to see how they work in practice.',
      },
    },
  },
  render: () => {
    const [rows, setRows] = useState([
      { id: '1', title: 'First Item' },
      { id: '2', title: 'Second Item' },
      { id: '3', title: 'Third Item' },
    ])

    const addRow = (current: number) => {
      const newRow = { id: `${Date.now()}`, title: `New Item ${rows.length + 1}` }
      const newRows = [...rows]
      newRows.splice(current, 0, newRow)
      setRows(newRows)
      return Promise.resolve()
    }

    const removeRow = (index: number) => {
      setRows(rows.filter((_, i) => i !== index))
    }

    const moveRow = (from: number, to: number) => {
      const newRows = [...rows]
      const [movedRow] = newRows.splice(from, 1)
      newRows.splice(to, 0, movedRow)
      setRows(newRows)
    }

    const duplicateRow = (index: number) => {
      const newRow = {
        id: `${Date.now()}`,
        title: `${rows[index].title} (Copy)`,
      }
      const newRows = [...rows]
      newRows.splice(index + 1, 0, newRow)
      setRows(newRows)
    }

    const copyRow = (index: number) => {
      void navigator.clipboard.writeText(JSON.stringify(rows[index]))
    }

    const pasteRow = (index: number) => {
      void navigator.clipboard.readText().then((text) => {
        try {
          const pastedRow = JSON.parse(text)
          pastedRow.id = `${Date.now()}`
          const newRows = [...rows]
          newRows.splice(index + 1, 0, pastedRow)
          setRows(newRows)
        } catch {
          // No valid data to paste
        }
      })
    }

    return (
      <div style={{ maxWidth: '600px', padding: '20px' }}>
        <h3>Array Field with Actions</h3>
        <p>Click the three-dot menu on each row to see the available actions:</p>
        {rows.map((row, index) => (
          <div
            key={row.id}
            style={{
              alignItems: 'center',
              backgroundColor: '#fff',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              margin: '8px 0',
              padding: '12px',
            }}
          >
            <span>{row.title}</span>
            <ArrayAction
              addRow={addRow}
              copyRow={copyRow}
              duplicateRow={duplicateRow}
              hasMaxRows={false}
              index={index}
              isSortable={true}
              moveRow={moveRow}
              pasteRow={pasteRow}
              removeRow={removeRow}
              rowCount={rows.length}
            />
          </div>
        ))}
      </div>
    )
  },
}
