import type { DocumentTabConfig, DocumentTabProps } from 'payload/types'

import React, { Fragment } from 'react'

import { DocumentTabLink } from './TabLink'
import './index.scss'

export const baseClass = 'doc-tab'

export const DocumentTab: React.FC<DocumentTabProps & DocumentTabConfig> = (props) => {
  const {
    Pill,
    apiURL,
    collectionConfig,
    condition,
    config,
    globalConfig,
    href: tabHref,
    i18n,
    isActive: tabIsActive,
    label,
    newTab,
  } = props

  const { routes } = config

  let href = typeof tabHref === 'string' ? tabHref : ''
  let isActive = typeof tabIsActive === 'boolean' ? tabIsActive : false

  if (typeof tabHref === 'function') {
    href = tabHref({
      apiURL,
      collection: collectionConfig,
      global: globalConfig,
      routes,
    })
  }

  if (typeof tabIsActive === 'function') {
    isActive = tabIsActive({
      href,
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
        adminRoute={routes.admin}
        baseClass={baseClass}
        href={href}
        isActive={isActive}
        isCollection={!!collectionConfig && !globalConfig}
        newTab={newTab}
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
