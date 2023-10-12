export const ready = (args: { serverURL: string }): void => {
  const { serverURL } = args

  if (typeof window !== 'undefined') {
    // This subscription may have been from either an iframe `src` or `window.open()`
    // i.e. `window?.opener` || `window?.parent`
    window?.opener?.postMessage(
      JSON.stringify({
        popupReady: true,
        type: 'payload-live-preview',
      }),
      serverURL,
    )
  }
}
