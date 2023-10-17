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

  const hasSentSchema = React.useRef(false)

  const [fields] = useAllFormFields()

  // The preview could either be an iframe embedded on the page
  // Or it could be a separate popup window
  // We need to transmit data to both accordingly
  useEffect(() => {
    // For performance, do no reduce fields to values until after the iframe or popup has loaded
    if (fields && window && 'postMessage' in window && appIsReady) {
      const values = reduceFieldsToValues(fields, true)

      // To reduce on large `postMessage` payloads, only send `fieldSchemaToJSON` one time
      const message = JSON.stringify({
        data: values,
        fieldSchemaJSON: !hasSentSchema.current ? fieldSchemaJSON : undefined,
        type: 'payload-live-preview',
      })

      // Post message to external popup window
      if (previewWindowType === 'popup' && popupRef.current) {
        popupRef.current.postMessage(message, url)
        hasSentSchema.current = true
      }

      // Post message to embedded iframe
      if (previewWindowType === 'iframe' && iframeRef.current) {
        console.log('posting to iframe')
        iframeRef.current.contentWindow?.postMessage(message, url)
        hasSentSchema.current = true
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
