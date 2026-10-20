import React from 'react'

import type { DocumentsTab } from '../../getDocuments.js'

import { ClockIcon } from '../../../../icons/Clock/index.js'
import { PinIcon } from '../../../../icons/Pin/index.js'
import './index.css'

export function EmptyState({
  children,
  description,
  descriptionID,
  tab,
  title,
}: {
  /** Actions shown below the text. */
  children?: React.ReactNode
  description: string
  descriptionID?: string
  tab: DocumentsTab
  title: string
}) {
  return (
    // A live region must not contain controls, so only announce the state when it has none.
    <div aria-live={children ? undefined : 'polite'} className="recents-widget__empty">
      <span
        aria-hidden="true"
        className={`recents-widget__empty-icon recents-widget__empty-icon--${tab}`}
      >
        {tab === 'pinned' ? <PinIcon /> : <ClockIcon />}
      </span>
      <span className="recents-widget__empty-text" id={descriptionID}>
        <span className="recents-widget__empty-title">{title}</span>
        <span className="recents-widget__empty-description">{description}</span>
      </span>
      {children}
    </div>
  )
}
