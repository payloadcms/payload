import { set } from 'date-fns'
import React, { Fragment, useCallback, useEffect } from 'react'

import type { LivePreviewViewProps } from '..'

import { useAllFormFields } from '../../../forms/Form/context'
import './index.scss'

const baseClass = 'live-preview-frame'

export const Preview: React.FC<LivePreviewViewProps> = (props) => {
  const ref = React.useRef<HTMLIFrameElement>(null)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  let url

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
  }

  const [fields] = useAllFormFields()

  useEffect(() => {
    if (hasLoaded && ref.current && fields && window && 'postMessage' in window) {
      ref.current.contentWindow?.postMessage(JSON.stringify({ fields }), '*')
    }
  }, [fields, url, hasLoaded])

  const handleLoad = useCallback(() => {
    setHasLoaded(true)
  }, [])

  return (
    <Fragment>
      <div className={baseClass}>
        <iframe
          className={`${baseClass}__iframe`}
          onLoad={handleLoad}
          ref={ref}
          src={url}
          title={url}
        />
      </div>
    </Fragment>
  )
}
