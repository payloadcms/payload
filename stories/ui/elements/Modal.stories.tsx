import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import React, { useState } from 'react'

import { Button } from '../../../packages/ui/src/elements/Button'
import { ConfirmationModal } from '../../../packages/ui/src/elements/ConfirmationModal'
import { Modal, useModal } from '../../../packages/ui/src/elements/Modal'
import { PayloadMockProviders } from '../../_mocks/MockProviders'

// Note: ModalProvider is now included in PayloadMockProviders

// Demo component for basic modal
const BasicModalDemo = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button buttonStyle="primary" onClick={() => setIsOpen(true)}>
        Open Basic Modal
      </Button>

      {isOpen && (
        <Modal className="basic-modal" slug="basic-modal">
          <div
            style={{
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
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0)',
                borderRadius: '8px',
                maxHeight: '80vh',
                maxWidth: '500px',
                overflow: 'auto',
                padding: '32px',
                width: '90%',
              }}
            >
              <h2 style={{ marginTop: 0 }}>Basic Modal</h2>
              <p>This is a basic modal dialog. You can put any content here.</p>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                }}
              >
                <Button buttonStyle="secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button buttonStyle="primary" onClick={() => setIsOpen(false)}>
                  OK
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// Demo component for confirmation modal
const ConfirmationModalDemo = () => {
  const [showModal, setShowModal] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleConfirm = async () => {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setResult('Confirmed!')
    setShowModal(false)
  }

  const handleCancel = () => {
    setResult('Cancelled')
    setShowModal(false)
  }

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <Button
          buttonStyle="primary"
          onClick={() => {
            setResult('')
            setShowModal(true)
          }}
        >
          Open Confirmation Modal
        </Button>

        {result && (
          <div
            style={{
              backgroundColor:
                result === 'Confirmed!' ? 'var(--theme-success-100)' : 'var(--theme-error-100)',
              borderRadius: '4px',
              color:
                result === 'Confirmed!' ? 'var(--theme-success-700)' : 'var(--theme-error-700)',
              marginTop: '12px',
              padding: '8px 12px',
            }}
          >
            Result: {result}
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
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
          }}
        >
          <ConfirmationModal
            body="Are you sure you want to delete this item? This action cannot be undone."
            cancelLabel="Cancel"
            confirmingLabel="Deleting..."
            confirmLabel="Delete"
            heading="Delete Item"
            modalSlug="confirmation-demo"
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        </div>
      )}
    </>
  )
}

const meta = {
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <Story />
      </PayloadMockProviders>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Modal components from Payload CMS including basic modals and confirmation dialogs.',
      },
    },
    layout: 'centered',
  },
  title: 'UI/Elements/Modal',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const BasicModal: Story = {
  render: () => <BasicModalDemo />,
}

export const ConfirmationDialog: Story = {
  render: () => <ConfirmationModalDemo />,
}

export const VariousConfirmations: Story = {
  render: () => {
    const [activeModal, setActiveModal] = useState<null | string>(null)
    const [results, setResults] = useState<Record<string, string>>({})

    const modalConfigs = [
      {
        id: 'delete',
        body: 'Are you sure you want to delete this item? This action cannot be undone.',
        buttonStyle: 'primary' as const,
        buttonText: 'Delete Item',
        cancelLabel: 'Cancel',
        confirmingLabel: 'Deleting...',
        confirmLabel: 'Delete',
        heading: 'Delete Item',
      },
      {
        id: 'save',
        body: 'Do you want to save your changes before leaving?',
        buttonStyle: 'secondary' as const,
        buttonText: 'Save Changes',
        cancelLabel: 'Discard',
        confirmingLabel: 'Saving...',
        confirmLabel: 'Save',
        heading: 'Save Changes',
      },
      {
        id: 'logout',
        body: 'Are you sure you want to log out? Any unsaved work will be lost.',
        buttonStyle: 'pill' as const,
        buttonText: 'Log Out',
        cancelLabel: 'Stay',
        confirmingLabel: 'Logging out...',
        confirmLabel: 'Log Out',
        heading: 'Log Out',
      },
    ]

    const handleConfirm = async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setResults((prev) => ({ ...prev, [id]: 'Confirmed' }))
      setActiveModal(null)
    }

    const handleCancel = (id: string) => {
      setResults((prev) => ({ ...prev, [id]: 'Cancelled' }))
      setActiveModal(null)
    }

    return (
      <div style={{ padding: '20px' }}>
        <h3>Various Confirmation Modals</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          {modalConfigs.map((config) => (
            <div key={config.id}>
              <Button
                buttonStyle={config.buttonStyle}
                onClick={() => {
                  setResults((prev) => ({ ...prev, [config.id]: '' }))
                  setActiveModal(config.id)
                }}
              >
                {config.buttonText}
              </Button>

              {results[config.id] && (
                <div
                  style={{
                    backgroundColor:
                      results[config.id] === 'Confirmed'
                        ? 'var(--theme-success-100)'
                        : 'var(--theme-error-100)',
                    borderRadius: '4px',
                    color:
                      results[config.id] === 'Confirmed'
                        ? 'var(--theme-success-700)'
                        : 'var(--theme-error-700)',
                    fontSize: '12px',
                    marginTop: '8px',
                    padding: '4px 8px',
                  }}
                >
                  {results[config.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {modalConfigs.map(
          (config) =>
            activeModal === config.id && (
              <div
                key={config.id}
                style={{
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
                }}
              >
                <ConfirmationModal
                  body={config.body}
                  cancelLabel={config.cancelLabel}
                  confirmingLabel={config.confirmingLabel}
                  confirmLabel={config.confirmLabel}
                  heading={config.heading}
                  modalSlug={`confirmation-${config.id}`}
                  onCancel={() => handleCancel(config.id)}
                  onConfirm={() => handleConfirm(config.id)}
                />
              </div>
            ),
        )}
      </div>
    )
  },
}

export const ModalSizes: Story = {
  render: () => {
    const [activeSize, setActiveSize] = useState<null | string>(null)

    const sizes = [
      { name: 'Small', width: '300px' },
      { name: 'Medium', width: '500px' },
      { name: 'Large', width: '700px' },
      { name: 'Extra Large', width: '900px' },
    ]

    return (
      <div style={{ padding: '20px' }}>
        <h3>Modal Sizes</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {sizes.map(({ name, width }) => (
            <Button buttonStyle="primary" key={name} onClick={() => setActiveSize(name)}>
              {name} Modal
            </Button>
          ))}
        </div>

        {activeSize && (
          <div
            style={{
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
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--theme-elevation-0)',
                borderRadius: '8px',
                maxHeight: '80vh',
                maxWidth: '90vw',
                overflow: 'auto',
                padding: '32px',
                width: sizes.find((s) => s.name === activeSize)?.width,
              }}
            >
              <h2 style={{ marginTop: 0 }}>{activeSize} Modal</h2>
              <p>This is a {activeSize.toLowerCase()} modal dialog.</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                }}
              >
                <Button buttonStyle="secondary" onClick={() => setActiveSize(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
}
