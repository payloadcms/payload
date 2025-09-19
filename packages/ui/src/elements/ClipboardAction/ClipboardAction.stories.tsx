import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ClientField, FormStateWithoutComponents } from 'payload'

import React from 'react'

import { ClipboardAction } from './index.js'

const meta: Meta<typeof ClipboardAction> = {
  component: ClipboardAction,
  parameters: {
    docs: {
      description: {
        component:
          'A menu component that provides copy and paste functionality for Arrays and Blocks in PayloadCMS.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/ClipboardAction',
}

export default meta

type Story = StoryObj<typeof ClipboardAction>

// Example array field schema for the story
const arrayFields = [
  {
    name: 'text',
    type: 'text',
    required: true,
  },
  {
    name: 'number',
    type: 'number',
  },
]

// Example data that would be copied
const exampleData = {
  number: 42,
  text: 'Example text',
}

const containerStyles: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '20px',
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of ClipboardAction in an array field context. Shows both copy and paste functionality.',
      },
    },
  },
  render: () => {
    return (
      <div style={containerStyles}>
        <ClipboardAction
          allowCopy
          allowPaste
          fields={arrayFields as ClientField[]}
          getDataToCopy={() => exampleData as FormStateWithoutComponents}
          onPaste={(data) => {
            console.log('Pasted data:', data)
          }}
          path="arrayField"
          type="array"
        />
        <div>
          <strong>Example Data:</strong> {JSON.stringify(exampleData, null, 2)}
        </div>
      </div>
    )
  },
}
