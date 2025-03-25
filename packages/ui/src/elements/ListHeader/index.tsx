import type { ClientCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'list-header'

type CollectionListHeaderProps = {
  readonly Actions?: React.ReactNode[]
  readonly AfterListHeaderContent?: React.ReactNode
  readonly className?: string
  readonly collectionConfig: ClientCollectionConfig
  readonly title?: string
  readonly TitleActions?: React.ReactNode[]
}
export const CollectionListHeader: React.FC<CollectionListHeaderProps> = (props) => {
  const { i18n } = useTranslation()

  return (
    <header className={[baseClass, props.className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__title-and-actions`}>
          <h1 className={`${baseClass}__title`}>
            {getTranslation(props.collectionConfig?.labels?.plural, i18n)}
          </h1>
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
