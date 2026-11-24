'use client'

import type { ReactNode } from 'react'

import { createContext, use, useCallback, useId, useMemo, useState } from 'react'

import type { RenderWidgetServerFnReturnType } from '../../../views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn.js'

import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

type PreviewContext = {
  getPreview: (args: { slug: string }) => Promise<ReactNode>
}

const Context = createContext<null | PreviewContext>(null)

/** Cache server-rendered thumbnails for this open drawer, including failed requests. */
export function WidgetPreviewProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(() => new Map<string, Promise<ReactNode>>())
  const sessionID = useId()
  const { serverFunction } = useServerFunctions()
  const { i18n } = useTranslation()
  const getPreview = useCallback(
    ({ slug }: { slug: string }) => {
      const key = `${i18n.language}:${slug}`
      const cached = cache.get(key)

      if (cached !== undefined) {
        return cached
      }
      const request = Promise.resolve()
        .then(() =>
          serverFunction({
            name: 'render-widget',
            args: {
              isPreview: true,
              widgetId: `widget-preview-${sessionID}-${slug}`,
              widgetSlug: slug,
            },
          }),
        )
        .then((result) => (result as RenderWidgetServerFnReturnType).component)
        .catch(() => null)

      cache.set(key, request)
      return request
    },
    [cache, i18n.language, serverFunction, sessionID],
  )
  const value = useMemo(() => ({ getPreview }), [getPreview])

  return <Context value={value}>{children}</Context>
}

export function useWidgetPreview() {
  const context = use(Context)

  if (!context) {
    throw new Error('Widget previews require a WidgetPreviewProvider')
  }
  return context
}
