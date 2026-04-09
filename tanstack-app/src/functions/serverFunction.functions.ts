import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

/**
 * Client-side server function handler that calls the Payload server function
 * endpoint via a direct fetch instead of TanStack Start's createServerFn RPC.
 *
 * This avoids seroval serialization issues with complex Payload form state
 * objects that may contain React elements, functions, or Symbols.
 */
export const serverFunctionHandler: ServerFunctionClient = async (
  args: ServerFunctionClientArgs,
) => {
  const res = await fetch('/api/server-function', {
    body: JSON.stringify(args),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Server function failed: ${errorText}`)
  }

  return res.json()
}
