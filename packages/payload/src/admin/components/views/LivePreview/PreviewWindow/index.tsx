import React, { useEffect } from 'react'

import type { LivePreview } from '../../../../../exports/config'
import type { EditViewProps } from '../../types'
import type { usePopupWindow } from '../usePopupWindow'

import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
import { LivePreviewProvider } from '../PreviewContext'
import { useLivePreviewContext } from '../PreviewContext/context'
import { IFrame } from '../PreviewIFrame'
import { LivePreviewToolbar } from '../Toolbar'
import { ToolbarArea } from '../ToolbarArea'
import './index.scss'

const baseClass = 'live-preview-window'

const ResponsiveWindow: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { breakpoint, breakpoints, deviceFrameRef, zoom } = useLivePreviewContext()

  const foundBreakpoint = breakpoint && breakpoints.find((bp) => bp.name === breakpoint)

  let x = '0'
  let margin = '0'

  if (foundBreakpoint && breakpoint !== 'responsive') {
    x = '-50%'

    if (
      typeof zoom === 'number' &&
      typeof foundBreakpoint.width === 'number' &&
      typeof foundBreakpoint.height === 'number'
    ) {
      const scaledWidth = foundBreakpoint.width / zoom
      const difference = scaledWidth - foundBreakpoint.width
      x = `${difference / 2}px`
      margin = 'auto'
    }
  }

  return (
    <div
      className={`${baseClass}__responsive-window`}
      ref={deviceFrameRef}
      style={{
        height:
          foundBreakpoint && typeof foundBreakpoint?.height === 'number'
            ? `${foundBreakpoint?.height / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
            ? `${100 / zoom}%`
            : '100%',
        margin,
        transform: `translate3d(${x}, 0, 0)`,
        width:
          foundBreakpoint && typeof foundBreakpoint?.width === 'number'
            ? `${foundBreakpoint?.width / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
            ? `${100 / zoom}%`
            : '100%',
      }}
    >
      {children}
    </div>
  )
}

const Preview: React.FC<
  EditViewProps & {
    popupState: ReturnType<typeof usePopupWindow>
    url?: string
  }
> = (props) => {
  const {
    popupState: { isPopupOpen, popupHasLoaded, popupRef },
    url,
  } = props

  const { iframeHasLoaded, iframeRef, setIframeHasLoaded } = useLivePreviewContext()

  const { breakpoint, toolbarPosition } = useLivePreviewContext()

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
  }, [
    fields,
    url,
    iframeHasLoaded,
    isPopupOpen,
    popupRef,
    popupHasLoaded,
    iframeRef,
    setIframeHasLoaded,
  ])

  if (!isPopupOpen) {
    return (
      <div
        className={[
          baseClass,
          isPopupOpen && `${baseClass}--popup-open`,
          breakpoint && breakpoint !== 'responsive' && `${baseClass}--has-breakpoint`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <ToolbarArea>
          <div className={`${baseClass}__wrapper`}>
            <ResponsiveWindow>
              <IFrame ref={iframeRef} setIframeHasLoaded={setIframeHasLoaded} url={url} />
            </ResponsiveWindow>
          </div>
          <LivePreviewToolbar
            {...props}
            iframeRef={iframeRef}
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
            }}
            url={url}
          />
        </ToolbarArea>
      </div>
    )
  }
}

export const PreviewWindow: React.FC<
  EditViewProps & {
    popupState: ReturnType<typeof usePopupWindow>
    url?: string
  }
> = (props) => {
  let url

  let breakpoints: LivePreview['breakpoints'] = [
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

  return (
    <LivePreviewProvider {...props} breakpoints={breakpoints} url={url}>
      <Preview {...props} />
    </LivePreviewProvider>
  )
}
