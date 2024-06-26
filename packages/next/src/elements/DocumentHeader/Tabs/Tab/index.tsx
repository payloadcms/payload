import type { DocumentTabConfig, DocumentTabProps } from 'payload'

import React, { Fragment } from 'react'

import { DocumentTabLink } from './TabLink.js'
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
    permissions,
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

  const meetsCondition =
    !condition ||
    (condition && Boolean(condition({ collectionConfig, config, globalConfig, permissions })))

  if (meetsCondition) {
    const labelToRender =
      typeof label === 'function'
        ? label({
            t: i18n.t,
          })
        : label

    return (
      <DocumentTabLink
        adminRoute={routes.admin}
        ariaLabel={labelToRender}
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
