import React from 'react'

import './index.scss'

export const listHeaderClass = 'list-header'

type ListHeaderProps = {
  readonly Actions?: React.ReactNode[]
  readonly AfterListHeaderContent?: React.ReactNode
  readonly className?: string
  readonly title: string
  readonly TitleActions?: React.ReactNode[]
}
export const ListHeader: React.FC<ListHeaderProps> = (props) => {
  return (
    <header className={[listHeaderClass, props.className].filter(Boolean).join(' ')}>
      <div className={`${listHeaderClass}__content`}>
        <div className={`${listHeaderClass}__title-and-actions`}>
          <h1 className={`${listHeaderClass}__title`}>{props.title}</h1>
          {props.TitleActions?.length ? (
            <div className={`${listHeaderClass}__title-actions`}>{props.TitleActions}</div>
          ) : null}
        </div>
        {props.Actions?.length ? (
          <div className={`${listHeaderClass}__actions`}>{props.Actions}</div>
        ) : null}
      </div>
      {props.AfterListHeaderContent ? (
        <div className={`${listHeaderClass}__after-header-content`}>
          {props.AfterListHeaderContent}
        </div>
      ) : null}
    </header>
  )
}
