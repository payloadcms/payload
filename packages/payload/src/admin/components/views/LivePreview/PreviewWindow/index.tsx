import React, { useEffect } from 'react'

import type { usePopupWindow } from '../usePopupWindow'

import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
import { IFrame } from '../PreviewIFrame'
import { EditViewProps } from '../../types'

import { LivePreviewProvider } from '../PreviewContext'
import { LivePreview } from '../../../../../exports/config'
import { useLivePreviewContext } from '../PreviewContext/context'

import { ToolbarArea } from '../ToolbarArea'
import { LivePreviewToolbar } from '../Toolbar'

import './index.scss'

const baseClass = 'live-preview-window'

const ResponsiveWindow: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { breakpoint, zoom, breakpoints, deviceFrameRef } = useLivePreviewContext()

  const foundBreakpoint = breakpoint && breakpoints.find((bp) => bp.name === breakpoint)

  let x = '0'

  if (foundBreakpoint && breakpoint !== 'responsive') {
    x = '-50%'

    if (
      typeof zoom === 'number' &&
      typeof foundBreakpoint.width === 'number' &&
      typeof foundBreakpoint.height === 'number'
    ) {
      // keep it centered horizontally
      x = `${foundBreakpoint.width / 2}px`
    }
  }

  return (
    <div
      ref={deviceFrameRef}
      className={`${baseClass}__responsive-window`}
      style={{
        height:
          foundBreakpoint && typeof foundBreakpoint?.height === 'number'
            ? `${foundBreakpoint?.height / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
            ? `${100 / zoom}%`
            : '100%',
        width:
          foundBreakpoint && typeof foundBreakpoint?.width === 'number'
            ? `${foundBreakpoint?.width / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
            ? `${100 / zoom}%`
            : '100%',
        transform: `translate3d(${x}, 0, 0)`,
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
  } = props

  const { iframeRef, setIframeHasLoaded, iframeHasLoaded } = useLivePreviewContext()

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

  const { toolbarPosition, breakpoint } = useLivePreviewContext()

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
              <IFrame ref={iframeRef} url={url} setIframeHasLoaded={setIframeHasLoaded} />
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
    <LivePreviewProvider {...props} breakpoints={breakpoints}>
      <Preview {...props} />
    </LivePreviewProvider>
  )
}
