'use client'

import { DialogModal, FullscreenModal, Modal, Popup, PopupList, useModal } from '@payloadcms/ui'
import { useState } from 'react'

export function CustomIDModals() {
  const { closeModal, openModal } = useModal()
  const [hasRemovedOpener, setHasRemovedOpener] = useState(false)
  const [hasMountedParent, setHasMountedParent] = useState(false)
  const [hasRemovedChildOpener, setHasRemovedChildOpener] = useState(false)

  return (
    <>
      <Popup button="Confirmation actions" popupType="menu" theme="auto">
        {!hasRemovedOpener && (
          <Popup
            buttonType="custom"
            popupType="menu"
            renderButton={({ active: _active, ...props }) => (
              <button {...props} type="button">
                More confirmation actions
              </button>
            )}
            theme="auto"
          >
            <PopupList.Button onClick={() => openModal('popup-confirmation')}>
              Open popup confirmation
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                setHasRemovedOpener(true)
                setHasMountedParent(true)
                openModal('lazy-parent')
              }}
            >
              Open nested modal flow
            </PopupList.Button>
            <PopupList.Button
              onClick={() => {
                setHasRemovedOpener(true)
                openModal('popup-confirmation')
              }}
            >
              Open and remove opener
            </PopupList.Button>
          </Popup>
        )}
      </Popup>
      {hasMountedParent && (
        <DialogModal slug="lazy-parent">
          <h2>Lazy parent</h2>
          <button onClick={() => openModal('child-slug')} type="button">
            Open nested child
          </button>
          <Popup button="Child actions" popupType="menu" theme="auto">
            {!hasRemovedChildOpener && (
              <Popup button="More child actions" popupType="menu" theme="auto">
                <PopupList.Button
                  onClick={() => {
                    setHasRemovedChildOpener(true)
                    openModal('child-slug')
                  }}
                >
                  Open and remove child opener
                </PopupList.Button>
              </Popup>
            )}
          </Popup>
          <button onClick={() => closeModal('lazy-parent')} type="button">
            Close lazy parent
          </button>
        </DialogModal>
      )}
      <DialogModal slug="popup-confirmation">
        <h2>Popup confirmation</h2>
        <button onClick={() => setHasRemovedOpener(true)} type="button">
          Remove opener
        </button>
        <button onClick={() => closeModal('popup-confirmation')} type="button">
          Close popup confirmation
        </button>
      </DialogModal>
      <button onClick={() => openModal('locked-slug')} type="button">
        Open locked dialog
      </button>
      <DialogModal closeOnEsc={false} slug="locked-slug">
        <h2>Locked title</h2>
        <button onClick={() => openModal('child-slug')} type="button">
          Open child
        </button>
        <button onClick={() => closeModal('locked-slug')} type="button">
          Close locked dialog
        </button>
      </DialogModal>
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
