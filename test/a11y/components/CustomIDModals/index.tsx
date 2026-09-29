'use client'

import { FullscreenModal, Modal, useModal } from '@payloadcms/ui'

export function CustomIDModals() {
  const { closeModal, openModal } = useModal()

  return (
    <>
      <button onClick={() => openModal('parent-slug')} type="button">
        Open parent
      </button>
      <Modal closeOnBlur={false} data-testid="parent" id="custom-parent-id" slug="parent-slug">
        <h2>Parent title</h2>
        <button onClick={() => openModal('child-slug')} type="button">
          Open child
        </button>
        <button onClick={() => closeModal('parent-slug')} type="button">
          Close parent
        </button>
      </Modal>
      <FullscreenModal
        closeOnBlur={false}
        data-testid="child"
        id="custom-child-id"
        slug="child-slug"
      >
        <h2>Child title</h2>
        <button onClick={() => closeModal('child-slug')} type="button">
          Close child
        </button>
      </FullscreenModal>
    </>
  )
}
