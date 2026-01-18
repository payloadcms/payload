import type {
  DocumentTabConfig,
  DocumentTabServerPropsOnly,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
} from '@ruya.sa/payload'
import type React from 'react'

import { RenderServerComponent } from '@ruya.sa/ui/elements/RenderServerComponent'
import { Fragment } from 'react'

import { DocumentTabLink } from './TabLink.js'
import './index.scss'

export const baseClass = 'doc-tab'

export const DefaultDocumentTab: React.FC<{
  apiURL?: string
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  path?: string
  permissions?: SanitizedPermissions
  req: PayloadRequest
  tabConfig: { readonly Pill_Component?: React.FC } & DocumentTabConfig
}> = (props) => {
  const {
    apiURL,
    collectionConfig,
    globalConfig,
    permissions,
    req,
    tabConfig: { href: tabHref, isActive: tabIsActive, label, newTab, Pill, Pill_Component },
  } = props

  let href = typeof tabHref === 'string' ? tabHref : ''
  let isActive = typeof tabIsActive === 'boolean' ? tabIsActive : false

  if (typeof tabHref === 'function') {
    href = tabHref({
      apiURL,
      collection: collectionConfig,
      global: globalConfig,
      routes: req.payload.config.routes,
    })
  }

  if (typeof tabIsActive === 'function') {
    isActive = tabIsActive({
      href,
    })
  }

  const labelToRender =
    typeof label === 'function'
      ? label({
          t: req.i18n.t,
        })
      : label

  return (
    <DocumentTabLink
      adminRoute={req.payload.config.routes.admin}
      ariaLabel={labelToRender}
      baseClass={baseClass}
      href={href}
      isActive={isActive}
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
              importMap: req.payload.importMap,
              serverProps: {
                i18n: req.i18n,
                payload: req.payload,
                permissions,
                req,
                user: req.user,
              } satisfies DocumentTabServerPropsOnly,
            })}
          </Fragment>
        ) : null}
      </span>
    </DocumentTabLink>
  )
}
