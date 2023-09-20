import React, { useCallback, useEffect } from 'react'

import type { LivePreviewViewProps } from '..'

import { useAllFormFields } from '../../../forms/Form/context'
import reduceFieldsToValues from '../../../forms/Form/reduceFieldsToValues'
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
      const values = reduceFieldsToValues(fields)
      ref.current.contentWindow?.postMessage(JSON.stringify({ data: values }), url)
    }
  }, [fields, url, hasLoaded])

  const handleLoad = useCallback(() => {
    setHasLoaded(true)
  }, [])

  return (
    <div className={baseClass}>
      <iframe
        className={`${baseClass}__iframe`}
        onLoad={handleLoad}
        ref={ref}
        src={url}
        title={url}
      />
    </div>
  )
}
