/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'
import { CloseModalButton } from './index.js'

const meta: Meta<typeof CloseModalButton> = {
  component: CloseModalButton,
  parameters: {
    docs: {
      description: {
        component: 'A standardized close button component with an X icon for closing modals.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/CloseModalButton',
}

export default meta

type Story = StoryObj<typeof meta>

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

const modalStyles: React.CSSProperties = {
  alignItems: 'flex-start',
  backgroundColor: 'var(--theme-elevation-0)',
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: '4px',
  boxShadow:
    'var(--theme-elevation-300) 0px 0px 0px 1px, var(--theme-elevation-100) 0px 4px 6px -1px',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '500px',
  padding: '20px',
  position: 'relative',
  width: '100%',
}

const ModalDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <div style={containerStyles}>
      <Button onClick={openModal}>Show Close Button Demo</Button>
      <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', textAlign: 'center' }}>
        Click the button to toggle the modal and see the close button in action.
      </div>

      {isOpen && (
        <div style={modalStyles}>
          <div style={{ alignSelf: 'flex-end', marginBottom: '10px' }}>
            <button
              aria-label="Close modal"
              onClick={closeModal}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
              type="button"
            >
              <CloseModalButton slug="demo-modal" />
            </button>
          </div>
          <div style={{ opacity: 0.7, textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px' }}>This is a demo modal.</p>
            <p style={{ margin: 0 }}>Focus on the X button in the top-right corner.</p>
            <p style={{ margin: '10px 0 0' }}>Click the X button to close the modal.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Basic usage of CloseModalButton. Click the button to toggle the modal and see the close button in action.',
      },
    },
  },
  render: () => <ModalDemo />,
}
