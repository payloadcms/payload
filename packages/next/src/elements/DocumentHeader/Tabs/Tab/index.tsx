import type { DocumentTabConfig, DocumentTabProps } from 'payload'

import { RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import { DocumentTabLink } from './TabLink.js'
import './index.scss'

export const baseClass = 'doc-tab'

export const DocumentTab: React.FC<
  { Pill_Component?: React.FC } & DocumentTabConfig & DocumentTabProps
> = (props) => {
  const {
    Pill,
    Pill_Component,
    apiURL,
    collectionConfig,
    condition,
    globalConfig,
    href: tabHref,
    i18n,
    isActive: tabIsActive,
    label,
    newTab,
    payload,
    permissions,
  } = props
  const { config } = payload
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

    const createMappedComponent = getCreateMappedComponent({
      importMap: payload.importMap,
      serverProps: {
        i18n,
        payload,
        permissions,
      },
    })

    const mappedPin = createMappedComponent(Pill, undefined, Pill_Component, 'Pill')

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
          {mappedPin && (
            <Fragment>
              &nbsp;
              <RenderComponent mappedComponent={mappedPin} />
            </Fragment>
          )}
        </span>
      </DocumentTabLink>
    )
  }

  return null
}
