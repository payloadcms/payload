export const handleTakeOver = async ({
  id,
  clearRouteCache,
  collectionSlug,
  documentLockStateRef,
  globalSlug,
  isLockingEnabled,
  isWithinDoc,
  setCurrentEditor,
  setIsReadOnlyForIncomingUser,
  updateDocumentEditor,
  user
}) => {
  if (!isLockingEnabled) {
    return;
  }
  try {
    // Call updateDocumentEditor to update the document's owner to the current user
    await updateDocumentEditor(id, collectionSlug ?? globalSlug, user);
    if (!isWithinDoc) {
      documentLockStateRef.current.hasShownLockedModal = true;
    }
    // Update the locked state to reflect the current user as the owner
    documentLockStateRef.current = {
      hasShownLockedModal: documentLockStateRef.current?.hasShownLockedModal,
      isLocked: true,
      user
    };
    setCurrentEditor(user);
    // If this is a takeover within the document, ensure the document is editable
    if (isWithinDoc && setIsReadOnlyForIncomingUser) {
      setIsReadOnlyForIncomingUser(false);
    }
    // Need to clear the route cache to refresh the page and update readOnly state for server rendered components
    if (clearRouteCache) {
      clearRouteCache();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during document takeover:', error);
  }
};
//# sourceMappingURL=handleTakeOver.js.map