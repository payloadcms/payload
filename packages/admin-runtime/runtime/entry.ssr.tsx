import { createFromReadableStream } from '@vitejs/plugin-rsc/ssr'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToReadableStream } from 'react-dom/server.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'

import type { RscPayload } from './entry.rsc.js'

import { registerShared } from './shared/registry.js'

declare global {
  var __payload_custom_ssr_files__: Record<string, string> | undefined
  var __vite_rsc_client_require__: (id: string) => unknown
}

registerShared('ssr', {
  '@payloadcms/richtext-lexical/client': () => import('@payloadcms/richtext-lexical/client'),
  '@payloadcms/translations': () => import('@payloadcms/translations'),
  '@payloadcms/ui': () => import('@payloadcms/ui'),
  '@payloadcms/ui/shared': () => import('@payloadcms/ui/shared'),
  react: () => import('react'),
  'react/jsx-runtime': () => import('react/jsx-runtime'),
  'react-dom': () => import('react-dom'),
})

// Custom components' client references point at modules compiled after this bundle was built.
const requireBuiltInClientModule = globalThis.__vite_rsc_client_require__
const customModules = new Map<string, Promise<unknown>>()
globalThis.__vite_rsc_client_require__ = (id) => {
  const file = globalThis.__payload_custom_ssr_files__?.[id]
  if (!file) {
    return requireBuiltInClientModule(id)
  }
  if (!customModules.has(file)) {
    customModules.set(file, import(/* @vite-ignore */ pathToFileURL(file).href))
  }
  return customModules.get(file)
}

export async function renderHTML(rscStream: ReadableStream<Uint8Array>) {
  const [renderStream, inlineStream] = rscStream.tee()
  let payload: Promise<RscPayload> | undefined

  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(renderStream)
    return React.use(payload).root
  }

  // Values Next.js would inline at compile time (see `define` in `vite.config.ts`), including the public
  // variables custom components may read.
  const runtimeEnv = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([name]) => name.startsWith('NEXT_PUBLIC_')),
    ),
    NEXT_BASE_PATH: process.env.NEXT_BASE_PATH ?? '',
    NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH:
      process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH ?? '',
    NEXT_TRAILING_SLASH: process.env.NEXT_TRAILING_SLASH ?? 'false',
  }
  const bootstrapScriptContent = await import.meta.viteRsc.loadBootstrapScriptContent('index')

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: `globalThis.__PAYLOAD_ENV__=${JSON.stringify(runtimeEnv)};${bootstrapScriptContent}`,
    onError(error) {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
    },
  })

  return htmlStream.pipeThrough(injectRSCPayload(inlineStream))
}
