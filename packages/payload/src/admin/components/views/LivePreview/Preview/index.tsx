import React, { useEffect } from 'react'

import type { LivePreviewViewProps } from '..'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'
import type { usePopupWindow } from '../usePopupWindow'

import { useResize } from '../../../../utilities/useResize'
import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
import { ToolbarProvider } from '../ToolbarProvider'
import './index.scss'

const baseClass = 'live-preview-frame'

export const Preview: React.FC<
  LivePreviewViewProps & {
    popupState: ReturnType<typeof usePopupWindow>
    url?: string
  }
> = (props) => {
  const {
    popupState: { isPopupOpen, popupHasLoaded, popupRef },
  } = props

  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const deviceFrameRef = React.useRef<HTMLDivElement>(null)
  const [iframeHasLoaded, setIframeHasLoaded] = React.useState(false)

  let url
  let breakpoints:
    | SanitizedCollectionConfig['admin']['livePreview']['breakpoints']
    | SanitizedGlobalConfig['admin']['livePreview']['breakpoints'] = [
    {
      name: 'responsive',
      height: '100%',
      label: 'Responsive',
      width: '100%',
    },
  ]

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
    breakpoints = breakpoints.concat(props?.collection.admin.livePreview.breakpoints)
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
    breakpoints = breakpoints.concat(props?.global.admin.livePreview.breakpoints)
  }

  const [breakpoint, setBreakpoint] = React.useState('responsive')

  const [fields] = useAllFormFields()

  // The preview could either be an iframe embedded on the page
  // Or it could be a separate popup window
  // We need to transmit data to both accordingly
  useEffect(() => {
    if (fields && window && 'postMessage' in window) {
      const values = reduceFieldsToValues(fields)
      const message = JSON.stringify({ data: values, type: 'livePreview' })

      // external window
      if (isPopupOpen) {
        setIframeHasLoaded(false)

        if (popupHasLoaded && popupRef.current) {
          popupRef.current.postMessage(message, url)
        }
      }

      // embedded iframe
      if (!isPopupOpen) {
        if (iframeHasLoaded && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(message, url)
        }
      }
    }
  }, [fields, url, iframeHasLoaded, isPopupOpen, popupRef, popupHasLoaded])

  const { size } = useResize(deviceFrameRef)

  if (!isPopupOpen) {
    return (
      <div
        className={[baseClass, isPopupOpen && `${baseClass}--popup-open`].filter(Boolean).join(' ')}
      >
        <div
          className={[
            `${baseClass}__wrapper`,
            breakpoint && breakpoint !== 'responsive' && `${baseClass}__wrapper--has-breakpoint`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            ref={deviceFrameRef}
            style={{
              height: breakpoints.find((bp) => bp.name === breakpoint)?.height || '100%',
              width: breakpoints.find((bp) => bp.name === breakpoint)?.width || '100%',
            }}
          >
            <ToolbarProvider
              {...props}
              breakpoint={breakpoint}
              breakpoints={breakpoints}
              deviceSize={size}
              setBreakpoint={setBreakpoint}
            >
              <iframe
                className={`${baseClass}__iframe`}
                onLoad={() => {
                  setIframeHasLoaded(true)
                }}
                ref={iframeRef}
                src={url}
                title={url}
              />
            </ToolbarProvider>
          </div>
        </div>
      </div>
    )
  }
}
