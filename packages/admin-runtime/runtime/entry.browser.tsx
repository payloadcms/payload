import {
  createFromFetch,
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from '@vitejs/plugin-rsc/browser'
import React, { startTransition, useEffect, useLayoutEffect, useState } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'

import type { NavigateOptions } from './client/navigationStore.js'
import type { ActionPayload, RscPayload } from './entry.rsc.js'

import { clearReplacedURL, navigate, refresh, setNavigator } from './client/navigationStore.js'
import { registerShared } from './shared/registry.js'

type RootState = { payload: Promise<RscPayload>; url: string } & NavigateOptions

registerShared('browser', {
  '@payloadcms/richtext-lexical/client': () => import('@payloadcms/richtext-lexical/client'),
  '@payloadcms/translations': () => import('@payloadcms/translations'),
  '@payloadcms/ui': () => import('@payloadcms/ui'),
  '@payloadcms/ui/shared': () => import('@payloadcms/ui/shared'),
  react: () => import('react'),
  'react/jsx-runtime': () => import('react/jsx-runtime'),
  'react-dom': () => import('react-dom'),
})

// Custom components' client references are the URLs of chunks compiled after this bundle was built.
const requireBuiltInClientModule = globalThis.__vite_rsc_client_require__
const customModules = new Map<string, Promise<unknown>>()
globalThis.__vite_rsc_client_require__ = (id) => {
  if (!id.includes('/__payload/custom/')) {
    return requireBuiltInClientModule(id)
  }
  if (!customModules.has(id)) {
    customModules.set(id, import(/* @vite-ignore */ id))
  }
  return customModules.get(id)
}

function BrowserRoot({ initial }: { initial: RootState }) {
  const [state, setState] = useState(initial)

  useEffect(() => {
    setNavigator(async (url, { history, scroll }) => {
      const response = await fetch(url, { headers: { 'x-payload-rsc': '1' } })
      const redirectTo = response.headers.get('x-payload-redirect')

      if (redirectTo) {
        return navigate(redirectTo, { history: history === 'none' ? 'replace' : history, scroll })
      }
      if (!response.ok && response.status !== 404) {
        window.location.assign(url)
        return
      }

      const payload = createFromFetch<RscPayload>(Promise.resolve(response))
      // Keep the current page on screen until the next one is ready, like Next's soft navigation.
      startTransition(() =>
        setState({ history, payload, scroll: scroll ?? history !== 'none', url }),
      )
      await payload.catch(() => {})
    })
  }, [])

  useLayoutEffect(() => {
    clearReplacedURL()
    if (state.history !== 'none') {
      window.history[state.history === 'push' ? 'pushState' : 'replaceState'](null, '', state.url)
    }
    if (state.scroll) {
      window.scrollTo(0, 0)
    }
  }, [state])

  return React.use(state.payload).root
}

setServerCallback(async (id, args) => {
  const temporaryReferences = createTemporaryReferenceSet()
  const response = fetch(window.location.pathname, {
    body: await encodeReply(args, { temporaryReferences }),
    headers: { 'x-payload-action': id },
    method: 'POST',
  })
  return (await createFromFetch<ActionPayload>(response, { temporaryReferences })).returnValue
})

// In development, refresh once the config or custom components changed, keeping client state.
if (globalThis.__PAYLOAD_ENV__?.PAYLOAD_DEV_REFRESH) {
  let version: string | undefined
  setInterval(async () => {
    if (document.visibilityState !== 'visible') {
      return
    }
    const latest = await fetch(`${import.meta.env.BASE_URL}dev`)
      .then((response) => response.text())
      .catch(() => version)
    if (version && latest !== version) {
      void refresh()
    }
    version = latest
  }, 1000)
}

window.addEventListener('popstate', () => {
  void navigate(`${window.location.pathname}${window.location.search}`, {
    history: 'none',
    scroll: false,
  })
})

hydrateRoot(
  document,
  <BrowserRoot
    initial={{
      history: 'none',
      payload: createFromReadableStream<RscPayload>(rscStream),
      scroll: false,
      url: `${window.location.pathname}${window.location.search}`,
    }}
  />,
)
