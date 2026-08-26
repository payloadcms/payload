'use client'
import type { UIFieldClientComponent } from 'payload'

import {
  Button,
  CheckboxInput,
  Drawer,
  DrawerToggler,
  fieldBaseClass,
  formatDrawerSlug,
  TextInput,
  useConfig,
  useDocumentInfo,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useState } from 'react'

import './index.css'

const drawerSlug = formatDrawerSlug({ slug: 'resize-preview', depth: 1 })

/**
 * Test-only tool: a UI field that adds a "Preview resize" action alongside
 * the collection's other fields, letting you type width/height and see the
 * already-uploaded file's dynamically-resized variant using the same
 * `?width=&height=` API documented in `docs/upload/transformers.mdx`. Never
 * persists anything — it only ever reads from the existing dynamic-resize
 * endpoint.
 */
export const ResizePreviewField: UIFieldClientComponent = () => {
  return (
    <div className={[fieldBaseClass, 'resize-preview-field'].join(' ')}>
      <DrawerToggler
        className="btn btn--style-primary btn--size-medium resize-preview__toggler"
        slug={drawerSlug}
      >
        Preview resize
      </DrawerToggler>
      <ResizePreviewDrawer />
    </div>
  )
}

const ResizePreviewDrawer: React.FC = () => {
  const { collectionSlug, data } = useDocumentInfo()
  const {
    config: {
      routes: { api },
    },
  } = useConfig()

  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [withoutEnlargement, setWithoutEnlargement] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)
  const [isLoading, setIsLoading] = useState(false)

  const filename = data?.filename as string | undefined

  const handleGeneratePreview = async () => {
    if (!filename) {
      setError('Upload a file before previewing a resize.')
      return
    }

    setIsLoading(true)
    setError(null)

    const query: Record<string, string> = {}
    if (width) {
      query.width = width
    }
    if (height) {
      query.height = height
    }
    if (withoutEnlargement) {
      query.withoutEnlargement = 'true'
    }

    const queryString = qs.stringify(query, { addQueryPrefix: true })
    const url = formatAdminURL({
      apiRoute: api,
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}${queryString}`,
      relative: true,
    })

    try {
      const response = await fetch(url, { credentials: 'include' })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(
          `Request failed with status ${response.status}${
            body?.errors?.[0]?.message ? `: ${body.errors[0].message}` : ''
          }`,
        )
        setPreviewSrc(null)
        return
      }

      const blob = await response.blob()
      setPreviewSrc(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview.')
      setPreviewSrc(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Drawer slug={drawerSlug} title="Preview resize">
      <div className="resize-preview">
        <TextInput
          id="resize-preview-width"
          label="Width"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setWidth(event.target.value)}
          path="resize-preview-width"
          value={width}
        />
        <TextInput
          id="resize-preview-height"
          label="Height"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setHeight(event.target.value)}
          path="resize-preview-height"
          value={height}
        />
        <div className={`${fieldBaseClass} checkbox`}>
          <CheckboxInput
            checked={withoutEnlargement}
            id="resize-preview-without-enlargement"
            label="withoutEnlargement"
            onToggle={(event) => setWithoutEnlargement(event.target.checked)}
          />
        </div>
        <Button
          buttonStyle="primary"
          className="resize-preview__generate"
          disabled={isLoading}
          onClick={handleGeneratePreview}
          type="button"
        >
          Generate preview
        </Button>
        {error && <p className="resize-preview__error">{error}</p>}
        {previewSrc && (
          <div className="resize-preview__result">
            <img alt="Resize preview" className="resize-preview__image" src={previewSrc} />
            <a
              className="btn btn--style-secondary btn--size-medium resize-preview__download"
              download={filename}
              href={previewSrc}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </Drawer>
  )
}
