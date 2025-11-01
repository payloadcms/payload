import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState } from 'react'
import { Modal, useModal } from '../../../packages/ui/src/elements/Modal'
import { ConfirmationModal } from '../../../packages/ui/src/elements/ConfirmationModal'
import { Button } from '../../../packages/ui/src/elements/Button'
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
        <Modal 
          slug="basic-modal"
          className="basic-modal"
        >
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginTop: 0 }}>Basic Modal</h2>
              <p>This is a basic modal dialog. You can put any content here.</p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
    await new Promise(resolve => setTimeout(resolve, 1000))
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
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: result === 'Confirmed!' ? '#d4edda' : '#f8d7da',
            color: result === 'Confirmed!' ? '#155724' : '#721c24',
            borderRadius: '4px'
          }}>
            Result: {result}
          </div>
        )}
      </div>
      
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <ConfirmationModal
            modalSlug="confirmation-demo"
            heading="Delete Item"
            body="Are you sure you want to delete this item? This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            confirmingLabel="Deleting..."
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      )}
    </>
  )
}

const meta = {
  title: 'UI/Elements/Modal',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal components from Payload CMS including basic modals and confirmation dialogs.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PayloadMockProviders>
        <Story />
      </PayloadMockProviders>
    ),
  ],
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
    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [results, setResults] = useState<Record<string, string>>({})
    
    const modalConfigs = [
      {
        id: 'delete',
        buttonText: 'Delete Item',
        buttonStyle: 'primary' as const,
        heading: 'Delete Item',
        body: 'Are you sure you want to delete this item? This action cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        confirmingLabel: 'Deleting...',
      },
      {
        id: 'save',
        buttonText: 'Save Changes',
        buttonStyle: 'secondary' as const,
        heading: 'Save Changes',
        body: 'Do you want to save your changes before leaving?',
        confirmLabel: 'Save',
        cancelLabel: 'Discard',
        confirmingLabel: 'Saving...',
      },
      {
        id: 'logout',
        buttonText: 'Log Out',
        buttonStyle: 'pill' as const,
        heading: 'Log Out',
        body: 'Are you sure you want to log out? Any unsaved work will be lost.',
        confirmLabel: 'Log Out',
        cancelLabel: 'Stay',
        confirmingLabel: 'Logging out...',
      },
    ]
    
    const handleConfirm = async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      setResults(prev => ({ ...prev, [id]: 'Confirmed' }))
      setActiveModal(null)
    }
    
    const handleCancel = (id: string) => {
      setResults(prev => ({ ...prev, [id]: 'Cancelled' }))
      setActiveModal(null)
    }
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Various Confirmation Modals</h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {modalConfigs.map((config) => (
            <div key={config.id}>
              <Button 
                buttonStyle={config.buttonStyle}
                onClick={() => {
                  setResults(prev => ({ ...prev, [config.id]: '' }))
                  setActiveModal(config.id)
                }}
              >
                {config.buttonText}
              </Button>
              
              {results[config.id] && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px',
                  padding: '4px 8px',
                  backgroundColor: results[config.id] === 'Confirmed' ? '#d4edda' : '#f8d7da',
                  color: results[config.id] === 'Confirmed' ? '#155724' : '#721c24',
                  borderRadius: '4px'
                }}>
                  {results[config.id]}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {modalConfigs.map((config) => (
          activeModal === config.id && (
            <div key={config.id} style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <ConfirmationModal
                modalSlug={`confirmation-${config.id}`}
                heading={config.heading}
                body={config.body}
                confirmLabel={config.confirmLabel}
                cancelLabel={config.cancelLabel}
                confirmingLabel={config.confirmingLabel}
                onConfirm={() => handleConfirm(config.id)}
                onCancel={() => handleCancel(config.id)}
              />
            </div>
          )
        ))}
      </div>
    )
  },
}

export const ModalSizes: Story = {
  render: () => {
    const [activeSize, setActiveSize] = useState<string | null>(null)
    
    const sizes = [
      { name: 'Small', width: '300px' },
      { name: 'Medium', width: '500px' },
      { name: 'Large', width: '700px' },
      { name: 'Extra Large', width: '900px' },
    ]
    
    return (
      <div style={{ padding: '20px' }}>
        <h3>Modal Sizes</h3>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {sizes.map(({ name, width }) => (
            <Button 
              key={name}
              buttonStyle="primary"
              onClick={() => setActiveSize(name)}
            >
              {name} Modal
            </Button>
          ))}
        </div>
        
        {activeSize && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '8px',
              width: sizes.find(s => s.name === activeSize)?.width,
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginTop: 0 }}>{activeSize} Modal</h2>
              <p>This is a {activeSize.toLowerCase()} modal dialog.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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