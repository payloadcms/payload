import React from 'react'

import type { DocumentTabProps } from './types'

import { DocumentTab } from './Tab'
import { getCustomViews } from './getCustomViews'
import './index.scss'
import { tabs } from './tabs'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<DocumentTabProps> = (props) => {
  const { collection, global, isEditing } = props
  const customViews = getCustomViews({ collection, global })

  // Don't show tabs when creating new documents
  if ((collection && isEditing) || global) {
    return (
      <div className={baseClass}>
        <ul className={`${baseClass}__tabs`}>
          {tabs?.map((Tab, index) => {
            return (
              <li className={`${baseClass}__tab`} key={index}>
                <DocumentTab {...props} {...Tab} />
              </li>
            )
          })}
          {customViews?.map((CustomView, index) => {
            const { Tab, path } = CustomView

            if (typeof Tab === 'function') {
              return (
                <li className={`${baseClass}__tab`} key={index}>
                  <Tab path={path} {...props} />
                </li>
              )
            }

            return <DocumentTab {...props} {...Tab} />
          })}
        </ul>
      </div>
    )
  }

  return null
}
