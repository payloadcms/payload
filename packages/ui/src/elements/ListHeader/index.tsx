import React from 'react'

import './index.scss'

const baseClass = 'list-header'

type ListHeaderProps = {
  readonly Actions?: React.ReactNode[]
  readonly AfterListHeaderContent?: React.ReactNode
  readonly className?: string
  readonly title: string
  readonly TitleActions?: React.ReactNode[]
}
export const ListHeader: React.FC<ListHeaderProps> = (props) => {
  return (
    <header className={[baseClass, props.className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__title-and-actions`}>
          <h1 className={`${baseClass}__title`}>{props.title}</h1>
          {props.TitleActions.length ? (
            <div className={`${baseClass}__title-actions`}>{props.TitleActions}</div>
          ) : null}
        </div>
        {props.Actions.length ? (
          <div className={`${baseClass}__actions`}>{props.Actions}</div>
        ) : null}
      </div>
      {props.AfterListHeaderContent ? (
        <div className={`${baseClass}__after-header-content`}>{props.AfterListHeaderContent}</div>
      ) : null}
    </header>
  )
}
