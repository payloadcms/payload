import React, { useEffect } from 'react'

import type { EditViewProps } from '../../types'

import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
import { useLivePreviewContext } from '../Context/context'
import { DeviceContainer } from '../Device'
import { IFrame } from '../IFrame'
import { LivePreviewToolbar } from '../Toolbar'
import './index.scss'

const baseClass = 'live-preview-window'

export const LivePreview: React.FC<EditViewProps> = (props) => {
  const {
    appIsReady,
    iframeHasLoaded,
    iframeRef,
    popupRef,
    previewWindowType,
    setIframeHasLoaded,
    url,
  } = useLivePreviewContext()

  const { breakpoint, fieldSchemaJSON } = useLivePreviewContext()

  const prevWindowType =
    React.useRef<ReturnType<typeof useLivePreviewContext>['previewWindowType']>()

  const [fields] = useAllFormFields()

  // The preview could either be an iframe embedded on the page
  // Or it could be a separate popup window
  // We need to transmit data to both accordingly
  useEffect(() => {
    // For performance, do no reduce fields to values until after the iframe or popup has loaded
    if (fields && window && 'postMessage' in window && appIsReady) {
      const values = reduceFieldsToValues(fields, true)

      // To reduce on large `postMessage` payloads, only send `fieldSchemaToJSON` one time
      // To do this, the underlying JS function maintains a cache of this value
      // So we need to send it through each time the window type changes
      // But only once per window type change, not on every render, because this is a potentially large obj
      const shouldSendSchema =
        !prevWindowType.current || prevWindowType.current !== previewWindowType

      prevWindowType.current = previewWindowType

      const message = JSON.stringify({
        data: values,
        fieldSchemaJSON: shouldSendSchema ? fieldSchemaJSON : undefined,
        type: 'payload-live-preview',
      })

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
    fields,
    url,
    iframeHasLoaded,
    previewWindowType,
    popupRef,
    appIsReady,
    iframeRef,
    setIframeHasLoaded,
    fieldSchemaJSON,
  ])

  if (previewWindowType === 'iframe') {
    return (
      <div
        className={[
          baseClass,
          breakpoint && breakpoint !== 'responsive' && `${baseClass}--has-breakpoint`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__wrapper`}>
          <LivePreviewToolbar {...props} />
          <div className={`${baseClass}__main`}>
            <DeviceContainer>
              <IFrame ref={iframeRef} setIframeHasLoaded={setIframeHasLoaded} url={url} />
            </DeviceContainer>
          </div>
        </div>
      </div>
    )
  }
}
