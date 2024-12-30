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
  if (abortControllerRef.current) {
    try {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    } catch (_err) {
      // swallow error
    }
  } else {
    const controller = new AbortController()
    abortControllerRef.current = controller
    return controller
  }
}
