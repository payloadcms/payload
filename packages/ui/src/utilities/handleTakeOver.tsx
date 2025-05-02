import type { ClientUser } from 'payload'

export const handleTakeOver = (
  id: number | string,
  collectionSlug: string,
  globalSlug: string,
  user: ClientUser | number | string,
  isWithinDoc: boolean,
  updateDocumentEditor: (
    docID: number | string,
    slug: string,
    user: ClientUser | number | string,
  ) => Promise<void>,
  setCurrentEditor: (value: React.SetStateAction<ClientUser | number | string>) => void,
  documentLockStateRef: React.RefObject<{
    hasShownLockedModal: boolean
    isLocked: boolean
    user: ClientUser | number | string
  }>,
  isLockingEnabled: boolean,
  setIsReadOnlyForIncomingUser?: (value: React.SetStateAction<boolean>) => void,
): void => {
  if (!isLockingEnabled) {
    return
  }

  try {
    // Call updateDocumentEditor to update the document's owner to the current user
    void updateDocumentEditor(id, collectionSlug ?? globalSlug, user)

    if (!isWithinDoc) {
      documentLockStateRef.current.hasShownLockedModal = true
    }

    // Update the locked state to reflect the current user as the owner
    documentLockStateRef.current = {
      hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal,
      isLocked: true,
      user,
    }
    setCurrentEditor(user)

    // If this is a takeover within the document, ensure the document is editable
    if (isWithinDoc && setIsReadOnlyForIncomingUser) {
      setIsReadOnlyForIncomingUser(false)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during document takeover:', error)
  }
}
