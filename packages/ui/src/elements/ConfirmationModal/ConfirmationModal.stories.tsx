/* eslint-disable no-restricted-exports */
import type { Meta, StoryObj } from '@storybook/react-vite'

import React, { useState } from 'react'

import { Button } from '../Button/index.js'

const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'A modal component for confirming user actions with customizable heading, body, and button labels.',
      },
    },
    payloadContext: true,
  },
  title: 'Elements/ConfirmationModal',
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

const modalOverlayStyles: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  left: 0,
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 1000,
}

const modalStyles: React.CSSProperties = {
  alignItems: 'flex-start',
  backgroundColor: 'var(--theme-elevation-0)',
  borderRadius: '4px',
  boxShadow:
    'var(--theme-elevation-300) 0px 0px 0px 1px, var(--theme-elevation-100) 0px 4px 6px -1px',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--base)',
  maxWidth: '500px',
  padding: 'var(--base)',
  position: 'relative',
  width: '90%',
}

const contentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'calc(var(--base) * 0.4)',
}

const controlsStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'calc(var(--base) * 0.4)',
}

const ConfirmationModalDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConfirming(false)
    closeModal()
    alert('Action confirmed!')
  }

  return (
    <div style={containerStyles}>
      <Button onClick={openModal}>Show Confirmation Modal</Button>
      <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', textAlign: 'center' }}>
        Click the button to open a confirmation modal and test the confirm/cancel actions.
      </div>

      {isOpen && (
        <div role="dialog" style={modalOverlayStyles} tabIndex={-1}>
          <div role="document" style={modalStyles} tabIndex={-1}>
            <div style={contentStyles}>
              <h1>Delete Item</h1>
              <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            </div>
            <div style={controlsStyles}>
              <Button
                buttonStyle="secondary"
                disabled={isConfirming}
                onClick={closeModal}
                size="large"
                type="button"
              >
                Cancel
              </Button>
              <Button disabled={isConfirming} onClick={handleConfirm} size="large">
                {isConfirming ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
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
        story: 'Basic usage of ConfirmationModal with a delete confirmation example.',
      },
    },
  },
  render: () => <ConfirmationModalDemo />,
}
