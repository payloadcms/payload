import React, { Fragment } from 'react'

import type { LivePreviewViewProps } from '..'

import './index.scss'

const baseClass = 'live-preview-frame'

export const Preview: React.FC<LivePreviewViewProps> = (props) => {
  let url

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
  }

  return (
    <Fragment>
      <div className={baseClass}>
        <iframe className={`${baseClass}__iframe`} src={url} title={url} />
      </div>
    </Fragment>
  )
}
