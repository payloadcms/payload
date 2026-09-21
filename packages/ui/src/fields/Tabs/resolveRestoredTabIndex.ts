type Args = {
  /**
   * The `tabIndex` read back from the document's stored preferences. Untyped
   * because preferences are user data and may hold anything.
   */
  storedTabIndex: unknown
  tabCount: number
}

/**
 * Resolves which tab a document's stored preferences ask for.
 *
 * Returns `undefined` when there is nothing valid to restore, so the caller
 * leaves the current tab alone rather than falling back to the first tab. A
 * fallback would move the user off a tab they had already selected, because the
 * preference read is asynchronous and can land after the selection.
 */
export const resolveRestoredTabIndex = ({ storedTabIndex, tabCount }: Args): number | undefined => {
  if (typeof storedTabIndex !== 'number' || !Number.isInteger(storedTabIndex)) {
    return undefined
  }

  if (storedTabIndex < 0 || storedTabIndex >= tabCount) {
    return undefined
  }

  return storedTabIndex
}
