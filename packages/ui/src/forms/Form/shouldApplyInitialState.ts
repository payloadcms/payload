export type ShouldApplyInitialStateArgs = {
  alreadyApplied: boolean
  documentChanged: boolean
  hasInitialState: boolean
  modified: boolean
}

/**
 * RSC re-renders of the document view pass a new `initialState` object even when
 * the editor is mid-keystroke. Skip that replace while the form is dirty, but still
 * apply on first mount and when the document id changes.
 */
export function shouldApplyInitialState({
  alreadyApplied,
  documentChanged,
  hasInitialState,
  modified,
}: ShouldApplyInitialStateArgs): boolean {
  if (!hasInitialState) {
    return false
  }

  if (!alreadyApplied || documentChanged) {
    return true
  }

  return !modified
}
