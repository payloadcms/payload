export type ViteHotContext = {
  off: (event: string, cb: (data?: unknown) => void) => void
  on: (event: string, cb: (data?: unknown) => void) => void
}

const eventName = 'payload:compiling'

/**
 * Listens for the `payload:compiling` custom event broadcast by `payloadDevCompileStatus`
 * (the Vite plugin registered in `withPayload`) over Vite's HMR websocket.
 */
export function connectDevCompileStatus({
  hot,
  onChange,
}: {
  hot: undefined | ViteHotContext
  onChange: (isCompiling: boolean) => void
}): () => void {
  if (!hot) {
    return () => {}
  }

  const handleMessage = (data?: unknown) => {
    onChange(Boolean((data as { isCompiling?: boolean } | undefined)?.isCompiling))
  }

  hot.on(eventName, handleMessage)

  return () => {
    hot.off(eventName, handleMessage)
  }
}
