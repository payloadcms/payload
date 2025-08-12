'use client'

import type { EditViewProps } from 'payload'

import { reduceFieldsToValues } from 'payload/shared'
import React, { useEffect } from 'react'

import { useAllFormFields } from '../../../forms/Form/context.js'
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js'
import { useLivePreviewContext } from '../../../providers/LivePreview/context.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { ShimmerEffect } from '../../ShimmerEffect/index.js'
import { DeviceContainer } from '../Device/index.js'
import { IFrame } from '../IFrame/index.js'
import { LivePreviewToolbar } from '../Toolbar/index.js'
import './index.scss'

const baseClass = 'live-preview-window'

export const LivePreviewWindow: React.FC<EditViewProps> = (props) => {
  const {
    appIsReady,
    breakpoint,
    fieldSchemaJSON,
    iframeHasLoaded,
    iframeRef,
    isLivePreviewing,
    popupRef,
    previewWindowType,
    setIframeHasLoaded,
    url,
  } = useLivePreviewContext()

  const locale = useLocale()

  const { mostRecentUpdate } = useDocumentEvents()

  const prevWindowType =
    React.useRef<ReturnType<typeof useLivePreviewContext>['previewWindowType']>(undefined)

  const [formState] = useAllFormFields()

  // For client-side apps, send data through `window.postMessage`
  // The preview could either be an iframe embedded on the page
  // Or it could be a separate popup window
  // We need to transmit data to both accordingly
  useEffect(() => {
    if (!isLivePreviewing) {
      return
    }

    // For performance, do no reduce fields to values until after the iframe or popup has loaded
    if (formState && window && 'postMessage' in window && appIsReady) {
      const values = reduceFieldsToValues(formState, true)

      // To reduce on large `postMessage` payloads, only send `fieldSchemaToJSON` one time
      // To do this, the underlying JS function maintains a cache of this value
      // So we need to send it through each time the window type changes
      // But only once per window type change, not on every render, because this is a potentially large obj
      const shouldSendSchema =
        !prevWindowType.current || prevWindowType.current !== previewWindowType

      prevWindowType.current = previewWindowType

      const message = {
        type: 'payload-live-preview',
        data: values,
        externallyUpdatedRelationship: mostRecentUpdate,
        fieldSchemaJSON: shouldSendSchema ? fieldSchemaJSON : undefined,
        locale: locale.code,
      }

      // Post message to external popup window
      if (previewWindowType === 'popup' && popupRef.current) {
        popupRef.current.postMessage(message, url)
      }

      // Post message to embedded iframe
      if (previewWindowType === 'iframe' && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(message, url)
      }
    }
  }, [
    formState,
    url,
    iframeHasLoaded,
    previewWindowType,
    popupRef,
    appIsReady,
    iframeRef,
    setIframeHasLoaded,
    fieldSchemaJSON,
    mostRecentUpdate,
    locale,
    isLivePreviewing,
  ])

  // To support SSR, we transmit a `window.postMessage` event without a payload
  // This is because the event will ultimately trigger a server-side roundtrip
  // i.e., save, save draft, autosave, etc. will fire `router.refresh()`
  useEffect(() => {
    if (!isLivePreviewing) {
      return
    }

    const message = {
      type: 'payload-document-event',
    }

    // Post message to external popup window
    if (previewWindowType === 'popup' && popupRef.current) {
      popupRef.current.postMessage(message, url)
    }

    // Post message to embedded iframe
    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, url)
    }
  }, [mostRecentUpdate, iframeRef, popupRef, previewWindowType, url, isLivePreviewing])

  if (previewWindowType === 'iframe') {
    return (
      <div
        className={[
          baseClass,
          isLivePreviewing && `${baseClass}--is-live-previewing`,
          breakpoint && breakpoint !== 'responsive' && `${baseClass}--has-breakpoint`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__wrapper`}>
          <LivePreviewToolbar {...props} />
          <div className={`${baseClass}__main`}>
            <DeviceContainer>
              {url ? (
                <IFrame ref={iframeRef} setIframeHasLoaded={setIframeHasLoaded} url={url} />
              ) : (
                <ShimmerEffect height="100%" />
              )}
            </DeviceContainer>
          </div>
        </div>
      </div>
    )
  }
}
