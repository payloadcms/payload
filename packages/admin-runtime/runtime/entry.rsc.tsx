import type { SanitizedConfig } from 'payload'

import { RootLayout } from '@payloadcms/ui/layouts'
import { renderNotFoundPage } from '@payloadcms/ui/views/NotFound/page'
import { renderRoot } from '@payloadcms/ui/views/Root'
import { defaultAdminViews } from '@payloadcms/ui/views/Root/adminViews'
import {
  createTemporaryReferenceSet,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from '@vitejs/plugin-rsc/rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveImportMapFilePath } from 'payload/internal'
import React from 'react'

import type { renderHTML } from './entry.ssr.js'
import type { CustomComponents, CustomComponentsOptions } from './server/customComponents.js'
import type { NavIntent } from './server/serverAdapter.js'

import { LocationProvider, RouterAdapter } from './client/RouterAdapter.js'
import { serverFunctionContext } from './server/context.js'
import { compile, createCustomComponentsCompiler } from './server/customComponents.js'
import { onAdminHandlerCreated } from './server/devConfigReload.js'
import { builtInImportMap } from './server/importMap.js'
import { createInitAdminContext } from './server/initAdminContext.js'
import { serveAsset } from './server/serveAsset.js'
import { createRequestServerAdapter, isNavigationError } from './server/serverAdapter.js'
import { serverFunction } from './server/serverFunction.js'
import { registerShared } from './shared/registry.js'
import '@payloadcms/ui/css/app.css'

export type RscPayload = { root: React.ReactNode }
export type ActionPayload = { returnValue: unknown }

/** Must match `base` in `vite.config.ts`. */
const ASSETS_PATH = '/__payload/'
const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client')
// The project root, the same one `payload generate:importmap` uses.
const rootDir = process.env.ROOT_DIR ?? process.cwd()
const customComponentsDir = path.join(rootDir, '.payload', 'admin')

registerShared('rsc', {
  '@payloadcms/richtext-lexical/client': () => import('@payloadcms/richtext-lexical/client'),
  '@payloadcms/richtext-lexical/rsc': () => import('@payloadcms/richtext-lexical/rsc'),
  '@payloadcms/translations': () => import('@payloadcms/translations'),
  '@payloadcms/ui': () => import('@payloadcms/ui'),
  '@payloadcms/ui/rsc': () => import('@payloadcms/ui/rsc'),
  '@payloadcms/ui/shared': () => import('@payloadcms/ui/shared'),
  '@vitejs/plugin-rsc/rsc': () => import('@vitejs/plugin-rsc/rsc'),
  react: () => import('react'),
  'react/jsx-runtime': () => import('react/jsx-runtime'),
})

async function getCustomComponentsOptions(
  config: SanitizedConfig,
): Promise<{ assetsURL: string } & CustomComponentsOptions> {
  const importMapFile = await resolveImportMapFilePath({
    adminRoute: config.routes.admin,
    importMapFile: config.admin.importMap.importMapFile,
    rootDir,
  })
  if (importMapFile instanceof Error) {
    throw importMapFile
  }
  // The compiler reads export names from the SSR environment's shared modules.
  await import.meta.viteRsc.loadModule('ssr', 'index')

  return {
    assetsURL: `${config.routes.admin}${ASSETS_PATH}custom/`,
    importMapFile,
    outDir: customComponentsDir,
  }
}

/** Compiles the custom components ahead of time, so production never has to. Run by `payload build`. */
export async function compileCustomComponents({
  config,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
}) {
  await compile(await getCustomComponentsOptions(await config))
}

export function createAdminHandler({
  config,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
}) {
  const configPromise = Promise.resolve(config)
  let getCustomComponents: Promise<() => Promise<CustomComponents>> | undefined

  onAdminHandlerCreated()

  return async function handleAdminRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const sanitizedConfig = await configPromise
    const adminRoute = sanitizedConfig.routes.admin
    const assetsURL = `${adminRoute}${ASSETS_PATH}`

    if (url.pathname.startsWith(assetsURL)) {
      const file = url.pathname.slice(assetsURL.length)
      return file.startsWith('custom/')
        ? serveAsset({
            dir: path.join(customComponentsDir, 'client'),
            file: file.slice('custom/'.length),
          })
        : serveAsset({ dir: clientDir, file })
    }

    getCustomComponents ??= getCustomComponentsOptions(sanitizedConfig).then(
      createCustomComponentsCompiler,
    )
    const custom = await (await getCustomComponents)()
    globalThis.__payload_custom_ssr_files__ = custom.ssrFiles

    const importMap = { ...builtInImportMap, ...custom.importMap }
    const nav: NavIntent = {}
    const responseCookies: string[] = []
    const serverAdapter = createRequestServerAdapter({ nav, request, responseCookies })
    const initAdminContext = createInitAdminContext({ request, serverAdapter })
    const isRSCRequest = request.headers.get('x-payload-rsc') === '1'
    const headers = new Headers({ 'Cache-Control': 'no-store' })

    const navigationResponse = () => {
      responseCookies.forEach((cookie) => headers.append('Set-Cookie', cookie))
      if (nav.type !== 'redirect' || !nav.url) {
        const status = nav.type === 'forbidden' ? 403 : nav.type === 'unauthorized' ? 401 : 404
        return new Response(null, { headers, status })
      }
      if (isRSCRequest) {
        headers.set('x-payload-redirect', nav.url)
        return new Response(null, { headers, status: 204 })
      }
      headers.set('Location', new URL(nav.url, request.url).href)
      return new Response(null, { headers, status: 307 })
    }

    const actionID = request.headers.get('x-payload-action')
    if (request.method === 'POST' && actionID) {
      return serverFunctionContext.run(
        { config: configPromise, importMap, initAdminContext },
        async () => {
          const temporaryReferences = createTemporaryReferenceSet()
          const body = request.headers.get('content-type')?.startsWith('multipart/form-data')
            ? await request.formData()
            : await request.text()
          const args = await decodeReply(body, { temporaryReferences })
          const action = await loadServerAction(actionID)
          const returnValue = Promise.resolve(action(...args))
          // Rejections reach the client through the RSC payload.
          returnValue.catch(() => {})

          responseCookies.forEach((cookie) => headers.append('Set-Cookie', cookie))
          headers.set('Content-Type', 'text/x-component')
          const stream = renderToReadableStream<ActionPayload>(
            { returnValue },
            { onError: logRenderError, temporaryReferences },
          )
          return new Response(stream, { headers })
        },
      )
    }

    const segments = url.pathname
      .slice(adminRoute.length)
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)
    const searchParams: Record<string, string | string[]> = {}
    for (const key of new Set(url.searchParams.keys())) {
      const values = url.searchParams.getAll(key)
      searchParams[key] = values.length > 1 ? values : values[0]!
    }

    let page: React.ReactNode
    let status = 200
    try {
      page = await renderRoot({
        adminViews: defaultAdminViews,
        config: configPromise,
        importMap,
        initAdminContext,
        key: segments.join('/'),
        notFound: serverAdapter.notFound,
        // Like Next's optional catch-all, the admin root has no segments at all.
        params: Promise.resolve({
          segments: segments.length > 0 ? segments : undefined,
        }) as Promise<{
          segments: string[]
        }>,
        redirect: serverAdapter.redirect,
        searchParams: Promise.resolve(searchParams),
      })
    } catch (error) {
      if (!isNavigationError(error)) {
        throw error
      }
      if (nav.type !== 'notFound') {
        return navigationResponse()
      }
      status = 404
      page = await renderNotFoundPage({
        config: configPromise,
        importMap,
        initAdminContext,
        params: Promise.resolve({ segments }),
        searchParams: Promise.resolve(searchParams),
      })
    }

    const root = (
      <LocationProvider adminRoute={adminRoute} url={`${url.pathname}${url.search}`}>
        <RootLayout
          config={configPromise}
          head={
            <>
              {/* The fonts `next/font` would self-host; the admin's CSS refers to them by name. */}
              <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Roboto+Mono:wght@100..700&display=swap"
                precedence="payload-fonts"
                rel="stylesheet"
              />
              {import.meta.viteRsc.loadCss()}
              {custom.cssURLs.map((href) => (
                <link href={href} key={href} precedence="payload-custom" rel="stylesheet" />
              ))}
            </>
          }
          importMap={importMap}
          initAdminContext={initAdminContext}
          RouterAdapter={RouterAdapter}
          serverFunction={serverFunction}
        >
          {page}
        </RootLayout>
      </LocationProvider>
    )

    // Navigation thrown deep inside a streamed view (e.g. an access check) only shows up on `nav`,
    // so the payload is buffered before anything is sent.
    const rscPayload = await new Response(
      renderToReadableStream<RscPayload>({ root }, { onError: logRenderError }),
    ).arrayBuffer()

    if (nav.type && nav.type !== 'notFound') {
      return navigationResponse()
    }

    responseCookies.forEach((cookie) => headers.append('Set-Cookie', cookie))

    if (isRSCRequest) {
      headers.set('Content-Type', 'text/x-component')
      return new Response(rscPayload, { headers, status })
    }

    const ssr = await import.meta.viteRsc.loadModule<{ renderHTML: typeof renderHTML }>(
      'ssr',
      'index',
    )
    headers.set('Content-Type', 'text/html; charset=utf-8')
    return new Response(await ssr.renderHTML(new Response(rscPayload).body!), { headers, status })
  }
}

function logRenderError(error: unknown) {
  if (!isNavigationError(error)) {
    // Not `console.error`: Next.js dev swallows it when called from unbundled code.
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  }
}
