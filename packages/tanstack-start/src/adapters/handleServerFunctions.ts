import type { ServerFunctionHandler } from 'payload'
import type { ReactNode } from 'react'

import { createServerFunctionHandler } from '@payloadcms/ui/utilities/handleServerFunctions'
import { renderToReadableStream } from '@tanstack/react-start/rsc'

import { initAdminContext } from '../utilities/initAdminContext.server.js'

const runServerFunction = createServerFunctionHandler({ initAdminContext })

export async function handleServerFunctions(
  args: Parameters<ServerFunctionHandler>[0],
): Promise<Response> {
  const result = await runServerFunction(args)

  // Flight accepts complete models; TanStack's non-RSC declaration only accepts ReactNode.
  return new Response(renderToReadableStream(result as ReactNode), {
    headers: { 'Content-Type': 'text/x-component' },
  })
}
