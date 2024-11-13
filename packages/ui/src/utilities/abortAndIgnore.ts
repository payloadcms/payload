export function abortAndIgnore(controller: AbortController) {
  if (controller) {
    try {
      controller.abort()
    } catch (_err) {
      // swallow error
    }
  }
}
