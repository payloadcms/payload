import React, { useCallback, useEffect } from 'react'

import type { LivePreviewViewProps } from '..'

import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
import { LivePreviewToolbar } from '../Toolbar'
import './index.scss'

const baseClass = 'live-preview-frame'

export const Preview: React.FC<
  LivePreviewViewProps & {
    isPopupOpen?: boolean
    popupRef?: React.MutableRefObject<Window | null>
    toggleWindow?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
    url?: string
  }
> = (props) => {
  const { isPopupOpen, popupRef, toggleWindow } = props

  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [iframeHasLoaded, setIframeHasLoaded] = React.useState(false)

  let url

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
  }

  const [fields] = useAllFormFields()

  // The preview could either be an iframe embedded on the page
  // Or it could be a separate popup window
  // We need to transmit data to both accordingly
  useEffect(() => {
    if (fields && window && 'postMessage' in window) {
      const values = reduceFieldsToValues(fields)
      const message = JSON.stringify({ data: values, type: 'livePreview' })

      // external window
      if (isPopupOpen && popupRef.current) {
        popupRef.current.postMessage(message, url)
      }

      // embedded iframe
      if (!isPopupOpen && iframeHasLoaded && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(message, url)
      }
    }
  }, [fields, url, iframeHasLoaded, isPopupOpen, popupRef])

  const handleLoad = useCallback(() => {
    setIframeHasLoaded(true)
  }, [])

  if (!isPopupOpen) {
    return (
      <div
        className={[baseClass, isPopupOpen && `${baseClass}--detached`].filter(Boolean).join(' ')}
      >
        <iframe
          className={`${baseClass}__iframe`}
          onLoad={handleLoad}
          ref={iframeRef}
          src={url}
          title={url}
        />
        <LivePreviewToolbar {...props} toggleWindow={toggleWindow} url={url} />
      </div>
    )
  }
}
