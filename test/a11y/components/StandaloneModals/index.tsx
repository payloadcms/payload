'use client'

import { ConfirmationModal, ModalContainer, ModalProvider, useModal } from '@payloadcms/ui'
import React, { useState } from 'react'

export function StandaloneModals() {
  return (
    <ModalProvider>
      <Confirmation />
      <ModalContainer />
    </ModalProvider>
  )
}

function Confirmation() {
  const { openModal } = useModal()
  const [result, setResult] = useState('Waiting for confirmation')

  return (
    <>
      <main>
        <h1>Standalone modals</h1>
        <button onClick={() => openModal('standalone-confirmation')} type="button">
          Open confirmation
        </button>
        <p role="status">{result}</p>
      </main>
      <ConfirmationModal
        body={
          <>
            <p>Confirm this action outside the admin.</p>
            <button onClick={() => openModal('nested-confirmation')} type="button">
              Open nested confirmation
            </button>
          </>
        }
        cancelLabel="Cancel action"
        confirmLabel="Confirm action"
        heading="Standalone confirmation"
        modalSlug="standalone-confirmation"
        onCancel={() => setResult('Cancelled')}
        onConfirm={() => setResult('Confirmed')}
      />
      <ConfirmationModal
        body="Confirm the nested action."
        cancelLabel="Cancel nested action"
        confirmLabel="Confirm nested action"
        heading="Nested confirmation"
        modalSlug="nested-confirmation"
        onConfirm={() => setResult('Nested action confirmed')}
      />
    </>
  )
}
