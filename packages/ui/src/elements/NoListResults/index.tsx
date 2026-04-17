import React from 'react'

import './index.scss'

const baseClass = 'no-results'

type NoResultsProps = {
  Actions?: React.ReactNode[]
  Message: React.ReactNode
}
export function NoListResults({ Actions, Message }: NoResultsProps) {
  return (
    <div className={baseClass}>
      {Message}
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
