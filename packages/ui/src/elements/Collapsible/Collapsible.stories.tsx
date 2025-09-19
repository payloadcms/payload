import type { Meta, StoryObj } from '@storybook/react-vite'

import React from 'react'

import { Button } from '../Button/index.js'
import { Collapsible } from './index.js'

const meta: Meta<typeof Collapsible> = {
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component:
          'A flexible collapsible component that provides smooth height animation and nested collapsible support.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/Collapsible',
}

export default meta

type Story = StoryObj<typeof Collapsible>

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

const collapsibleStyles: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: '4px',
  minWidth: '500px', // Ensures minimum width when collapsed
  width: '100%',
}

const sampleContent = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of Collapsible showing a header with title, description, action button, and expandable content.',
      },
    },
  },
  render: () => {
    return (
      <div style={containerStyles}>
        <div style={collapsibleStyles}>
          <Collapsible
            actions={
              <Button
                buttonStyle="icon-label"
                icon="edit"
                onClick={() => {
                  /* Handle edit click */
                }}
                round
              >
                Edit
              </Button>
            }
            header={
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: 0 }}>Section Title</h3>
                <p style={{ color: 'var(--theme-elevation-500)', margin: '10px 0 0' }}>
                  Click to expand/collapse the content
                </p>
              </div>
            }
          >
            <div style={{ padding: '0 20px 20px' }}>{sampleContent}</div>
          </Collapsible>
        </div>
        <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px' }}>
          Try clicking the chevron or header to toggle the content.
        </div>
      </div>
    )
  },
}
