import type { ImportMap, SanitizedConfig } from 'payload'

import { notFound, redirect } from '@tanstack/react-router'

import { initReq } from '../../utilities/initReq.js'

type Props = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  searchParams: Record<string, string | string[]>
  segments: string[]
}

/**
 * TanStack Start admin page renderer.
 * Equivalent of RootPage from @payloadcms/next/views.
 */
export async function RootPage({
  config: configPromise,
  importMap,
  searchParams,
  segments,
}: Props) {
  const { renderRootPage } = await import('@payloadcms/ui/views/Root/RenderRoot')

  const initPageResult = await initReq({
    config: configPromise,
    importMap,
    key: 'initPage',
  })

  return renderRootPage({
    importMap,
    initPageResult,
    notFound: () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound()
    },
    redirect: (url: string) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: url })
    },
    searchParams,
    segments,
  })
}
