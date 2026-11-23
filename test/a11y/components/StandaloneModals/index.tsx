'use client'

import { ConfirmationModal } from '@payloadcms/ui/elements/ConfirmationModal'
import { useModal } from '@payloadcms/ui/elements/Modal'
import { Popup, PopupList } from '@payloadcms/ui/elements/Popup'
import { ModalContainer, ModalProvider } from '@payloadcms/ui/providers/Modal'
import React, { useState } from 'react'

import { ShadowRoot } from './ShadowRoot/index.js'

export function StandaloneModals({ isShadow = false }: { isShadow?: boolean }) {
  const content = (
    <ModalProvider>
      <Confirmation />
      <ModalContainer />
    </ModalProvider>
  )

  return isShadow ? <ShadowRoot>{content}</ShadowRoot> : content
}

function Confirmation() {
  const { openModal } = useModal()
  const [result, setResult] = useState('Waiting for confirmation')
  const [isNestedMenuMounted, setIsNestedMenuMounted] = useState(true)

  return (
    <>
      <main>
        <h1>Standalone modals</h1>
        <button onClick={() => openModal('standalone-confirmation')} type="button">
          Open confirmation
        </button>
        <Popup
          button="Modal actions"
          onToggleOpen={() => setIsNestedMenuMounted(true)}
          popupType="menu"
          theme="auto"
        >
          {isNestedMenuMounted && (
            <Popup button="More modal actions" popupType="menu" theme="auto">
              <PopupList.Button
                onClick={() => {
                  openModal('standalone-confirmation')
                  setIsNestedMenuMounted(false)
                }}
              >
                Open confirmation from menu
              </PopupList.Button>
            </Popup>
          )}
        </Popup>
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
