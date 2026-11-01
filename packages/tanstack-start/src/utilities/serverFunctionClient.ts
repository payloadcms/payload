import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'

/** Builds the admin dispatcher with native Flight response decoding. */
export function createServerFunctionClient({
  runServerFn,
}: {
  runServerFn: (input: { data: ServerFunctionClientArgs }) => Promise<Response>
}): ServerFunctionClient {
  return (async (args: ServerFunctionClientArgs) => {
    const response = await runServerFn({ data: args })

    if (!response.ok) {
      throw new Error(`Payload server function failed with status ${response.status}`)
    }

    if (response.headers.get('content-type')?.split(';')[0]?.trim() !== 'text/x-component') {
      throw new Error('Expected a React Flight response from the Payload server function')
    }

    if (!response.body) {
      throw new Error('The Payload server function returned an empty Flight response')
    }

    const { createFromReadableStream } = await import('@tanstack/react-start/rsc')

    return await createFromReadableStream(response.body)
  }) as ServerFunctionClient
}
