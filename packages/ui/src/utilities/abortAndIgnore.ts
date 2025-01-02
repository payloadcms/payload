export function abortAndIgnore(abortController: AbortController) {
  if (abortController) {
    try {
      abortController.abort()
    } catch (_err) {
      // swallow error
    }
  }
}

export function handleAbortRef(
  abortControllerRef: React.RefObject<AbortController>,
): AbortController {
  const newController = new AbortController()

  if (abortControllerRef.current) {
    try {
      abortControllerRef.current.abort()
    } catch (_err) {
      // swallow error
    }
  }

  abortControllerRef.current = newController
  return newController
}
