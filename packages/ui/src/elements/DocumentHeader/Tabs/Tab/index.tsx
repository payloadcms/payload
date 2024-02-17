import React, { Fragment } from 'react'

import { DocumentTabLink } from './TabLink'

import { DocumentTabConfig, DocumentTabProps } from 'payload/types'

import './index.scss'

export const baseClass = 'doc-tab'

export const DocumentTab: React.FC<DocumentTabProps & DocumentTabConfig> = (props) => {
  const {
    id,
    apiURL,
    config,
    collectionConfig,
    condition,
    globalConfig,
    href: tabHref,
    isActive,
    label,
    newTab,
    Pill,
    i18n,
  } = props

  const { routes } = config

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

  if (!condition || (condition && condition({ collectionConfig, config, globalConfig }))) {
    const labelToRender =
      typeof label === 'function'
        ? label({
            t: i18n.t,
          })
        : label

    return (
      <DocumentTabLink
        href={href}
        newTab={newTab}
        baseClass={baseClass}
        isActive={isActive}
        adminRoute={routes.admin}
        isCollection={!!collectionConfig && !globalConfig}
      >
        <span className={`${baseClass}__label`}>
          {labelToRender}
          {Pill && (
            <Fragment>
              &nbsp;
              <Pill />
            </Fragment>
          )}
        </span>
      </DocumentTabLink>
    )
  }

  return null
}
