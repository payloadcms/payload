import React from 'react'

import type { ActivityDocumentType } from '../../utils/getActivityWidgetDocs.js'

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
  tab: ActivityDocumentType
  title: string
}) {
  return (
    // A live region must not contain controls, so only announce the state when it has none.
    <div aria-live={children ? undefined : 'polite'} className="activity-empty-state">
      <span aria-hidden="true" className="activity-empty-state__icon">
        {tab === 'pinned' ? <PinIcon /> : <ClockIcon />}
      </span>
      <span className="activity-empty-state__text" id={descriptionID}>
        <span className="activity-empty-state__title">{title}</span>
        <span className="activity-empty-state__description">{description}</span>
      </span>
      {children}
    </div>
  )
}
