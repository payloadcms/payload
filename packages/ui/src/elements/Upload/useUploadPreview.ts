'use client'

import type { SanitizedCollectionConfig, TransformState } from 'payload'

import { formatAdminURL } from 'payload/shared'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '../../providers/Config/index.js'

export function useUploadPreview({
  id,
  collectionSlug,
  updatedAt,
  variants,
}: {
  collectionSlug: string
  id?: null | number | string
  updatedAt?: string
  variants?: SanitizedCollectionConfig['upload']['variants']
}) {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const [previewSources, setPreviewSources] = useState<Record<string, string>>({})
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [hasPreviewError, setHasPreviewError] = useState(false)
  const sourcesRef = useRef<Record<string, string>>({})
  const replaceSources = useCallback((sources: Record<string, string>) => {
    Object.values(sourcesRef.current).forEach((src) => {
      if (!Object.values(sources).includes(src)) {
        URL.revokeObjectURL(src)
      }
    })
    sourcesRef.current = sources
    setPreviewSources(sources)
  }, [])
  const controllerRef = useRef<AbortController>(null)

  const resetPreview = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    replaceSources({})
    setIsPreviewLoading(false)
    setHasPreviewError(false)
  }, [replaceSources])

  useEffect(() => {
    resetPreview()
    return () => controllerRef.current?.abort()
  }, [id, updatedAt, resetPreview])

  useEffect(
    () => () => {
      Object.values(sourcesRef.current).forEach((src) => URL.revokeObjectURL(src))
    },
    [],
  )

  const requestPreview = useCallback(
    async ({ file, transforms }: { file?: File; transforms: null | TransformState }) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      replaceSources({})
      setIsPreviewLoading(true)
      setHasPreviewError(false)

      const sources: Record<string, string> = {}
      try {
        // Render the default and each configured variant from the same unsaved state.
        for (const variant of [undefined, ...(variants ?? []).map(({ name }) => name)]) {
          const formData = new FormData()
          formData.append('_payload', JSON.stringify({ _transforms: transforms, variant }))
          if (file) {
            formData.append('file', file)
          }
          const response = await fetch(
            formatAdminURL({
              apiRoute: api,
              path: `/${collectionSlug}/preview-file${id == null ? '' : `/${encodeURIComponent(id)}`}`,
            }),
            { body: formData, credentials: 'include', method: 'POST', signal: controller.signal },
          )
          // A configured variant can be omitted when enlargement is disabled.
          if (response.status === 422 && variant) {
            const error = await response.json()
            if (
              error.errors?.some(
                ({ data }: { data?: { code?: string } }) =>
                  data?.code === 'PREVIEW_VARIANT_OMITTED',
              )
            ) {
              continue
            }
          }
          if (!response.ok) {
            throw new Error('Unable to preview file edits.')
          }
          const blob = await response.blob()
          if (controller.signal.aborted) {
            break
          }
          sources[variant ?? 'default'] = URL.createObjectURL(blob)
          replaceSources({ ...sources })
        }
        if (controller.signal.aborted) {
          Object.values(sources).forEach((src) => URL.revokeObjectURL(src))
        } else {
          replaceSources(sources)
        }
      } catch {
        Object.values(sources).forEach((src) => URL.revokeObjectURL(src))
        if (!controller.signal.aborted) {
          replaceSources({})
          setHasPreviewError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPreviewLoading(false)
        }
      }
    },
    [api, collectionSlug, id, replaceSources, variants],
  )

  return {
    hasPreviewError,
    isPreviewLoading,
    previewSources,
    previewSrc: previewSources.default,
    requestPreview,
    resetPreview,
  }
}
