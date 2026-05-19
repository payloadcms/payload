import React from 'react'

import './index.css'

const baseClass = 'no-results'

type NoResultsProps = {
  Actions?: React.ReactNode[]
  description?: React.ReactNode
  title?: React.ReactNode
}
export function NoListResults({ Actions, description, title }: NoResultsProps) {
  return (
    <div className={baseClass}>
      {title ? <span className={`${baseClass}__title`}>{title}</span> : null}
      {description ? <p className={`${baseClass}__description`}>{description}</p> : null}
      {Actions && Actions.length > 0 && (
        <div className={`${baseClass}__actions`}>
          {Actions.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
