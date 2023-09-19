import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRouteMatch } from 'react-router-dom'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../../exports/types'

import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import './index.scss'
import { tabs } from './tabs'

const baseClass = 'doc-tabs'

export const DocumentTabs: React.FC<{
  apiURL?: string
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id: string
  isEditing?: boolean
}> = (props) => {
  const { id, apiURL, collection, global, isEditing } = props
  const match = useRouteMatch()
  const { t } = useTranslation('general')
  const location = useLocation()
  const { routes } = useConfig()

  const { versions } = useDocumentInfo()

  // Don't show tabs when creating new documents
  if ((collection && isEditing) || global) {
    return (
      <div className={baseClass}>
        <ul className={`${baseClass}__tabs`}>
          {tabs?.map((tab) => {
            const {
              condition,
              href: tabHref,
              isActive: checkIsActive,
              label,
              newTab,
              pillLabel,
            } = tab

            const href = tabHref({
              id,
              apiURL,
              collection,
              global,
              match,
              routes,
            })

            const isActive =
              typeof checkIsActive === 'function' ? checkIsActive({ href, location, match }) : false

            if (!condition || (condition && condition({ collection, global }))) {
              const labelToRender = typeof label === 'function' ? label({ t }) : label
              const pillToRender =
                typeof pillLabel === 'function' ? pillLabel({ versions }) : pillLabel

              return (
                <li
                  className={[`${baseClass}__tab`, isActive && `${baseClass}__tab--active`]
                    .filter(Boolean)
                    .join(' ')}
                  key={href}
                >
                  <Link
                    className={`${baseClass}__tab-link`}
                    to={href}
                    {...(newTab && { rel: 'noopener noreferrer', target: '_blank' })}
                  >
                    <span className={`${baseClass}__tab-label`}>
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
          })}
        </ul>
      </div>
    )
  }

  return null
}
