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
      <Variant label="Delete Action">
        <Button buttonStyle="destructive" onClick={() => openModal(MODAL_SLUG_DELETE)}>
          Delete
        </Button>
        <ConfirmationModal
          body={
            <span>
              You&apos;re about to move the [label] <strong>[document title]</strong> to the trash.
              Are you sure?
            </span>
          }
          cancelLabel="Cancel"
          confirmLabel="Delete"
          heading="Move [collection singular label] to trash"
          modalSlug={MODAL_SLUG_DELETE}
          onConfirm={async () => {
            // Simulate async action
            await new Promise((resolve) => setTimeout(resolve, 500))
          }}
        />
      </Variant>
      <Variant label="General Action">
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
