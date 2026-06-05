'use client'

import {
  Button,
  ConfirmationModal,
  DialogBody,
  DialogCancel,
  DialogConfirm,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DocumentLocked,
  DocumentTakeOver,
  useModal,
} from '@payloadcms/ui'
import React, { useState } from 'react'

import { Section, Variant } from '../shared.js'

const DIALOG_SLUG_BASIC = 'demo-dialog-basic'
const DIALOG_SLUG_SMALL = 'demo-dialog-small'
const DIALOG_SLUG_LARGE = 'demo-dialog-large'
const DIALOG_SLUG_NO_HEADER = 'demo-dialog-no-header'
const DIALOG_SLUG_HEADER_EXTRAS = 'demo-dialog-header-extras'
const DIALOG_SLUG_CONFIRM = 'demo-dialog-confirm'
const DIALOG_SLUG_CONFIRM_LOADING = 'demo-dialog-confirm-loading'

export const DialogSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const { openModal } = useModal()
  const [docLockedActive, setDocLockedActive] = useState(false)
  const [docTakeOverActive, setDocTakeOverActive] = useState(false)

  return (
    <Section id="dialog" selectedComponent={selectedComponent} title="Dialog">
      <Variant label="Basic (medium)">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_BASIC)}>
          Open Dialog
        </Button>
        <DialogModal slug={DIALOG_SLUG_BASIC}>
          <DialogHeader showClose title="Dialog Title" />
          <DialogBody>
            <p>This is the dialog body. Put any content here.</p>
          </DialogBody>
          <DialogFooter>
            <DialogCancel label="Cancel" />
            <DialogConfirm label="Confirm" onClick={async () => {}} />
          </DialogFooter>
        </DialogModal>
      </Variant>

      <Variant label="Small">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_SMALL)}>
          Open Small Dialog
        </Button>
        <DialogModal size="small" slug={DIALOG_SLUG_SMALL}>
          <DialogHeader showClose title="Small Dialog" />
          <DialogBody>
            <p>This dialog uses the small size (320px).</p>
          </DialogBody>
          <DialogFooter>
            <DialogConfirm label="OK" onClick={async () => {}} />
          </DialogFooter>
        </DialogModal>
      </Variant>

      <Variant label="Large">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_LARGE)}>
          Open Large Dialog
        </Button>
        <DialogModal size="large" slug={DIALOG_SLUG_LARGE}>
          <DialogHeader showClose title="Large Dialog" />
          <DialogBody>
            <p>This dialog uses the large size (640px).</p>
          </DialogBody>
          <DialogFooter>
            <DialogConfirm label="OK" onClick={async () => {}} />
          </DialogFooter>
        </DialogModal>
      </Variant>

      <Variant label="No Header">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_NO_HEADER)}>
          Open Dialog
        </Button>
        <DialogModal slug={DIALOG_SLUG_NO_HEADER}>
          <DialogBody>
            <p>
              This dialog has no header. Omit <code>DialogHeader</code> when no title or close
              button is needed.
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogCancel label="Cancel" />
            <DialogConfirm label="OK" onClick={async () => {}} />
          </DialogFooter>
        </DialogModal>
      </Variant>

      <Variant label="Header Extras Slot">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_HEADER_EXTRAS)}>
          Open Dialog
        </Button>
        <DialogModal slug={DIALOG_SLUG_HEADER_EXTRAS}>
          <DialogHeader showClose title="With Header Extras">
            <Button buttonStyle="pill">Extra Action</Button>
          </DialogHeader>
          <DialogBody>
            <p>
              The <code>DialogHeader</code> children slot renders beside the title, before the close
              button.
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogConfirm label="Done" onClick={async () => {}} />
          </DialogFooter>
        </DialogModal>
      </Variant>

      <Variant label="Confirmation Modal">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_CONFIRM)}>
          Open Confirmation Modal
        </Button>
        <ConfirmationModal
          body="Are you sure you want to delete this item? This action cannot be undone."
          heading="Delete Item"
          modalSlug={DIALOG_SLUG_CONFIRM}
          onConfirm={async () => {}}
        />
      </Variant>

      <Variant label="Confirmation Modal (with loading)">
        <Button buttonStyle="secondary" onClick={() => openModal(DIALOG_SLUG_CONFIRM_LOADING)}>
          Open Confirmation Modal
        </Button>
        <ConfirmationModal
          body="This will take a moment. Are you sure?"
          confirmingLabel="Publishing..."
          confirmLabel="Publish"
          heading="Publish Document"
          modalSlug={DIALOG_SLUG_CONFIRM_LOADING}
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 2000))}
        />
      </Variant>

      <Variant label="Document Locked">
        <Button buttonStyle="secondary" onClick={() => setDocLockedActive(true)}>
          Open Document Locked
        </Button>
        <DocumentLocked
          handleGoBack={() => setDocLockedActive(false)}
          isActive={docLockedActive}
          onReadOnly={() => setDocLockedActive(false)}
          onTakeOver={() => setDocLockedActive(false)}
          updatedAt={Date.now()}
          user={{ id: '123', collection: 'users', email: 'other@example.com' }}
        />
      </Variant>

      <Variant label="Document Take Over">
        <Button buttonStyle="secondary" onClick={() => setDocTakeOverActive(true)}>
          Open Document Take Over
        </Button>
        <DocumentTakeOver
          handleBackToDashboard={() => setDocTakeOverActive(false)}
          isActive={docTakeOverActive}
          onReadOnly={() => setDocTakeOverActive(false)}
        />
      </Variant>
    </Section>
  )
}
