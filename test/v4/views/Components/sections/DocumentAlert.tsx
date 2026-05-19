'use client'

import {
  Button,
  ConfirmationModal,
  DocumentLocked,
  DocumentStaleData,
  DocumentTakeOver,
  useModal,
} from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

export const DocumentAlertSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  const [lockedActive, setLockedActive] = useState(false)
  const [takeOverActive, setTakeOverActive] = useState(false)
  const [staleActive, setStaleActive] = useState(false)
  const { closeModal, toggleModal } = useModal()

  return (
    <Section
      columns={5}
      id="document-alert"
      selectedComponent={selectedComponent}
      title="Document Alerts"
    >
      <Variant>
        <Button buttonStyle="secondary" onClick={() => setLockedActive(true)}>
          Document Locked
        </Button>
        <DocumentLocked
          handleGoBack={() => setLockedActive(false)}
          isActive={lockedActive}
          onReadOnly={() => setLockedActive(false)}
          onTakeOver={() => setLockedActive(false)}
          updatedAt={Date.now() - 60000}
          user={{
            id: '123',
            collection: 'users',
            createdAt: '',
            email: 'other-user@example.com',
            updatedAt: '',
          }}
        />
      </Variant>
      <Variant>
        <Button buttonStyle="secondary" onClick={() => setTakeOverActive(true)}>
          Document Take Over
        </Button>
        <DocumentTakeOver
          handleBackToDashboard={() => setTakeOverActive(false)}
          isActive={takeOverActive}
          onReadOnly={() => setTakeOverActive(false)}
        />
      </Variant>
      <Variant>
        <Button buttonStyle="secondary" onClick={() => setStaleActive(true)}>
          Stale Data
        </Button>
        <DocumentStaleData isActive={staleActive} onReload={() => setStaleActive(false)} />
      </Variant>
      <Variant>
        <Button buttonStyle="secondary" onClick={() => toggleModal('leave-without-saving-demo')}>
          Leave Without Saving
        </Button>
        <ConfirmationModal
          body="Your changes have not been saved. Are you sure you want to leave?"
          cancelLabel="Stay on this page"
          confirmLabel="Leave anyway"
          heading="Leave without saving"
          modalSlug="leave-without-saving-demo"
          onConfirm={() => closeModal('leave-without-saving-demo')}
        />
      </Variant>
      <Variant>
        <Button buttonStyle="secondary" onClick={() => toggleModal('generate-confirmation-demo')}>
          Generate Confirmation
        </Button>
        <ConfirmationModal
          body={
            <p>
              Generating a new API key will <strong>invalidate</strong> the previous key. Are you
              sure you wish to continue?
            </p>
          }
          confirmLabel="Generate"
          heading="Confirm Generation"
          modalSlug="generate-confirmation-demo"
          onConfirm={() => closeModal('generate-confirmation-demo')}
        />
      </Variant>
    </Section>
  )
}
