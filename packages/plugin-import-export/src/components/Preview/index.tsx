'use client'
import React from 'react'

import './index.scss'

const baseClass = 'Preview'
export const Preview: React.FC<{ collectionSlug: string; exportCollectionSlug: string }> = ({
  collectionSlug,
}) => {
  //

  return (
    <React.Fragment>
      <div className={baseClass}>
        <h3>Preview</h3>
      </div>
    </React.Fragment>
  )
}
