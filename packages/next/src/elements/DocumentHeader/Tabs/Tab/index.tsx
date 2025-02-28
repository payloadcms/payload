import type { DocumentTabConfig, DocumentTabServerProps, ServerProps } from 'payload'
import type React from 'react'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { Fragment } from 'react'

import { DocumentTabLink } from './TabLink.js'
import './index.scss'

export const baseClass = 'doc-tab'

export const DocumentTab: React.FC<
  { readonly Pill_Component?: React.FC } & DocumentTabConfig & DocumentTabServerProps
> = (props) => {
  const {
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
    Pill,
    Pill_Component,
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
          {Pill || Pill_Component ? (
            <Fragment>
              &nbsp;
              {RenderServerComponent({
                Component: Pill,
                Fallback: Pill_Component,
                importMap: payload.importMap,
                serverProps: {
                  i18n,
                  payload,
                  permissions,
                } satisfies ServerProps,
              })}
            </Fragment>
          ) : null}
        </span>
      </DocumentTabLink>
    )
  }

  return null
}
