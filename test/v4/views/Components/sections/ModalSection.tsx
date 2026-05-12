'use client'

import { Button, ConfirmationModal, useModal } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const MODAL_SLUG_DELETE = 'demo-modal-delete'
const MODAL_SLUG_CONFIRM = 'demo-modal-confirm'

export const ModalSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const { openModal } = useModal()

  return (
    <Section id="modal" selectedComponent={selectedComponent} title="Modal">
      <Variant label="Delete Confirmation">
        <Button buttonStyle="destructive" onClick={() => openModal(MODAL_SLUG_DELETE)}>
          Delete Item
        </Button>
        <ConfirmationModal
          body="Are you sure you want to delete this item? This action cannot be undone."
          cancelLabel="Cancel"
          confirmLabel="Delete"
          heading="Delete Item"
          modalSlug={MODAL_SLUG_DELETE}
          onConfirm={async () => {
            // Simulate async action
            await new Promise((resolve) => setTimeout(resolve, 500))
          }}
        />
      </Variant>

      <Variant label="Generic Confirmation">
        <Button buttonStyle="secondary" onClick={() => openModal(MODAL_SLUG_CONFIRM)}>
          Confirm Action
        </Button>
        <ConfirmationModal
          body="Please confirm you want to proceed with this action."
          cancelLabel="No, go back"
          confirmLabel="Yes, proceed"
          heading="Confirm Action"
          modalSlug={MODAL_SLUG_CONFIRM}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, 300))
          }}
        />
      </Variant>
    </Section>
  )
}
