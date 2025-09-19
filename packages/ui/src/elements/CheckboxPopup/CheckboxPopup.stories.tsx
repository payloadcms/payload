import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'
import { CheckboxPopup } from './index.js'

const meta: Meta<typeof CheckboxPopup> = {
  component: CheckboxPopup,
  parameters: {
    payloadContext: true,
  },
  title: 'Elements/CheckboxPopup',
}

export default meta

type Story = StoryObj<typeof CheckboxPopup>

const options = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
  { label: 'Option 4', value: 'option4' },
]

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
          'The CheckboxPopup component provides a popup menu with a list of checkboxes. It is commonly used for multi-select filtering and configuration options.',
      },
    },
  },
  render: () => {
    const [selectedValues, setSelectedValues] = useState<string[]>([])

    return (
      <div style={containerStyles}>
        <CheckboxPopup
          Button={<Button>Select Options</Button>}
          onChange={({ selectedValues: newValues }) => {
            setSelectedValues(newValues)
          }}
          options={options}
          selectedValues={selectedValues}
        />
        <div>
          <strong>Selected Values:</strong> {selectedValues.join(', ') || 'None'}
        </div>
      </div>
    )
  },
}

export const WithPreselectedValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Example showing the CheckboxPopup with pre-selected values. The popup maintains the selection state and allows users to modify it.',
      },
    },
  },
  render: () => {
    const [selectedValues, setSelectedValues] = useState<string[]>(['option1', 'option3'])

    return (
      <div style={containerStyles}>
        <CheckboxPopup
          Button={<Button>Edit Selection</Button>}
          onChange={({ selectedValues: newValues }) => {
            setSelectedValues(newValues)
          }}
          options={options}
          selectedValues={selectedValues}
        />
        <div>
          <strong>Selected Values:</strong> {selectedValues.join(', ')}
        </div>
      </div>
    )
  },
}
