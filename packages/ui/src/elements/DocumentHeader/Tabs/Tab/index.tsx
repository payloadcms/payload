import React, { Fragment } from 'react'

import type { DocumentTabConfig } from '../types'
import type { DocumentTabProps } from '../types'
import { DocumentTabLink } from './TabLink'

import './index.scss'

const baseClass = 'doc-tab'

export const DocumentTab: React.FC<DocumentTabProps & DocumentTabConfig> = (props) => {
  const {
    id,
    apiURL,
    config,
    collectionConfig,
    condition,
    globalConfig,
    href: tabHref,
    isActive: checkIsActive,
    label,
    newTab,
    pillLabel,
    i18n,
  } = props

  const { routes } = config
  // const { versions } = documentInfo

  let href = typeof tabHref === 'string' ? tabHref : ''

  if (typeof tabHref === 'function') {
    href = tabHref({
      id,
      apiURL,
      collection: collectionConfig,
      global: globalConfig,
      routes,
    })
  }

  if (
    !condition ||
    (condition && condition({ collectionConfig, config, documentInfo: undefined, globalConfig }))
  ) {
    const labelToRender =
      typeof label === 'function'
        ? label({
            t: i18n.t,
          })
        : label

    const pillToRender =
      typeof pillLabel === 'function' ? pillLabel({ versions: undefined }) : pillLabel

    return (
      <DocumentTabLink href={href} newTab={newTab} baseClass={baseClass} isActive={checkIsActive}>
        <span className={`${baseClass}__label`}>
          {labelToRender}
          {pillToRender && (
            <Fragment>
              &nbsp;
              <span className={`${baseClass}__count`}>{pillToRender}</span>
            </Fragment>
          )}
        </span>
      </DocumentTabLink>
    )
  }

  return null
}
