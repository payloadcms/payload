'use client'

import type { EditViewProps } from 'payload'

import { reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect } from 'react'

import { useAllFormFields } from '../../../forms/Form/context.js'
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js'
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js'
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { IframeLoader } from '../../IframeLoader/index.js'
import { DeviceContainer } from '../Device/index.js'
import { LivePreviewToolbar } from '../Toolbar/index.js'
import './index.css'

const baseClass = 'live-preview-window'

export const LivePreviewWindow: React.FC<EditViewProps> = (props) => {
  const {
    appIsReady,
    breakpoint,
    iframeRef,
    isExpanded,
    isLivePreviewing,
    lastReadyAt,
    loadedURL,
    popupRef,
    setLoadedURL,
    shouldRenderIframe,
    url,
    zoom,
  } = useLivePreviewContext()

  const locale = useLocale()

  const { mostRecentUpdate } = useDocumentEvents()

  const [formState] = useAllFormFields()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const postMessageToTargets = useCallback(
    (message: object) => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.postMessage(message, url)
      }

      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(message, url)
      }
    },
    [iframeRef, popupRef, url],
  )

  const hasActiveTarget = isLivePreviewing || (popupRef.current && !popupRef.current.closed)

  /**
   * For client-side apps, send data through `window.postMessage`
   * The preview could either be an iframe embedded on the page
   * Or it could be a separate popup window
   * Also fires when a preview signals ready (lastReadyAt) to sync initial state
   */
  useEffect(() => {
    if (!hasActiveTarget || !appIsReady || !formState) {
      return
    }

    const values = reduceFieldsToValues(formState, true)

    if (!values.id) {
      values.id = id
    }

    postMessageToTargets({
      type: 'payload-live-preview',
      collectionSlug,
      data: values,
      externallyUpdatedRelationship: mostRecentUpdate,
      globalSlug,
      locale: locale.code,
    })
  }, [
    formState,
    collectionSlug,
    globalSlug,
    id,
    appIsReady,
    mostRecentUpdate,
    locale,
    hasActiveTarget,
    loadedURL,
    lastReadyAt,
    postMessageToTargets,
  ])

  /**
   * To support SSR, we transmit a `window.postMessage` event without a payload
   * This is because the event will ultimately trigger a server-side roundtrip
   * i.e., save, save draft, autosave, etc. will fire `router.refresh()`
   */
  useEffect(() => {
    if (!hasActiveTarget || !appIsReady) {
      return
    }

    postMessageToTargets({ type: 'payload-document-event' })
  }, [mostRecentUpdate, hasActiveTarget, appIsReady, postMessageToTargets])

  return (
    <div
      className={[
        baseClass,
        isLivePreviewing && `${baseClass}--is-live-previewing`,
        isExpanded && `${baseClass}--is-expanded`,
        breakpoint &&
          breakpoint !== 'responsive' &&
          breakpoint !== 'custom' &&
          `${baseClass}--has-breakpoint`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__wrapper`}>
        <LivePreviewToolbar {...props} />
        <div className={`${baseClass}__main`}>
          <DeviceContainer>
            {shouldRenderIframe && (
              <IframeLoader
                className="live-preview-iframe"
                id="live-preview-iframe"
                onLoad={() => {
                  setLoadedURL(url)
                }}
                ref={iframeRef}
                src={url}
                style={{
                  transform: typeof zoom === 'number' ? `scale(${zoom}) ` : undefined,
                }}
              />
            )}
          </DeviceContainer>
        </div>
      </div>
    </div>
  )
}
