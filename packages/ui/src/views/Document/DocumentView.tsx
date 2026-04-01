import type { AdminViewServerProps } from 'payload'

import { renderDocument } from './RenderDocument.js'

type DocumentViewProps = {
  notFound?: () => never
  redirect?: (url: string) => never
} & AdminViewServerProps

/**
 * Framework-agnostic DocumentView server component.
 * Accepts optional notFound/redirect callbacks (injected via serverProps from the adapter).
 * Falls back to error-throwing if callbacks are not provided.
 */
export async function DocumentView({ notFound, redirect, ...props }: DocumentViewProps) {
  const _notFound: () => never =
    notFound ??
    (() => {
      throw new Error('not-found')
    })
  const _redirect: (url: string) => never =
    redirect ??
    ((url: string) => {
      throw new Error(`REDIRECT:${url}`)
    })

  const { Document: RenderedDocument } = await renderDocument({
    ...props,
    notFound: _notFound,
    redirect: _redirect,
  })
  return RenderedDocument
}
