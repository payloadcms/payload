import type { AdminViewServerProps, RenderDocumentVersionsProperties } from 'payload'

import { renderDocument as renderDocumentFromUI } from '@payloadcms/ui/views/Document/RenderDocument'
import { notFound, redirect } from 'next/navigation.js'
import { logError } from 'payload'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { getMetaBySegment } from './getMetaBySegment.js'

export type { ViewToRender } from '@payloadcms/ui/views/Document/RenderDocument'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export const renderDocument = (
  args: {
    drawerSlug?: string
    overrideEntityVisibility?: boolean
    readonly redirectAfterCreate?: boolean
    readonly redirectAfterDelete?: boolean
    readonly redirectAfterDuplicate?: boolean
    readonly redirectAfterRestore?: boolean
    versions?: RenderDocumentVersionsProperties
  } & AdminViewServerProps,
) =>
  renderDocumentFromUI({
    ...args,
    notFound: () => notFound(),
    redirect: (url) => redirect(url),
  })

export async function DocumentView(props: AdminViewServerProps) {
  try {
    const { Document: RenderedDocument } = await renderDocument(props)
    return RenderedDocument
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    logError({ err: error, payload: props.initPageResult.req.payload })

    if (error.message === 'not-found') {
      notFound()
    }
  }
}
