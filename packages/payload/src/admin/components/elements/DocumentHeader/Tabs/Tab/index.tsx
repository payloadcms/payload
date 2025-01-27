import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRouteMatch } from 'react-router-dom'

import type { DocumentTabConfig } from '../types'
import type { DocumentTabProps } from '../types'

import { useConfig } from '../../../../utilities/Config'
import { useDocumentInfo } from '../../../../utilities/DocumentInfo'
import './index.scss'

const baseClass = 'doc-tab'

export const DocumentTab: React.FC<DocumentTabProps & DocumentTabConfig> = (props) => {
  const {
    id,
    apiURL,
    collection,
    condition,
    global,
    href: tabHref,
    isActive: checkIsActive,
    label,
    newTab,
    pillLabel,
  } = props

  const { t } = useTranslation('general')
  const location = useLocation()
  const config = useConfig()
  const documentInfo = useDocumentInfo()
  const match = useRouteMatch()

  const { routes } = config
  const { versions } = documentInfo

  let href = `${match.url}${typeof tabHref === 'string' ? tabHref : ''}`

  if (typeof tabHref === 'function') {
    href = tabHref({
      id,
      apiURL,
      collection,
      global,
      match,
      routes,
    })
  }

  const isActive =
    typeof checkIsActive === 'function'
      ? checkIsActive({ href, location, match })
      : typeof checkIsActive === 'boolean'
      ? checkIsActive
      : location.pathname.startsWith(href)

  if (
    !condition ||
    (condition && Boolean(condition({ collection, config, documentInfo, global })))
  ) {
    const labelToRender = typeof label === 'function' ? label({ t }) : label
    const pillToRender = typeof pillLabel === 'function' ? pillLabel({ versions }) : pillLabel

    return (
      <li className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}>
        <Link
          className={`${baseClass}__link`}
          to={href}
          {...(newTab && { rel: 'noopener noreferrer', target: '_blank' })}
          tabIndex={isActive ? -1 : 0}
        >
          <span className={`${baseClass}__label`}>
            {labelToRender}
            {pillToRender && (
              <Fragment>
                &nbsp;
                <span className={`${baseClass}__count`}>{pillToRender}</span>
              </Fragment>
            )}
          </span>
        </Link>
      </li>
    )
  }

  return null
}
