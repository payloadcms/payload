import React from 'react'

import './index.css'

export function EmptyState({
  children,
  description,
  descriptionID,
  icon,
  title,
}: {
  children?: React.ReactNode
  description: string
  descriptionID?: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div aria-live="polite" className="activity-empty-state">
      <span aria-hidden="true" className="activity-empty-state__icon">
        {icon}
      </span>
      <span className="activity-empty-state__text" id={descriptionID}>
        <span className="activity-empty-state__title">{title}</span>
        <span className="activity-empty-state__description">{description}</span>
      </span>
      {children}
    </div>
  )
}
