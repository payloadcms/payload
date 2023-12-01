import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import Account from '../../graphics/Account'
import { useCollectionGlobalConfigs } from '../../utilities/CollectionGlobalConfigs'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { getPathSegmentInfo } from '../../utilities/PathSegmentInfo'
import { Hamburger } from '../Hamburger'
import Localizer from '../Localizer'
import { LocalizerLabel } from '../Localizer/LocalizerLabel'
import { NavToggler } from '../Nav/NavToggler'
import { useNav } from '../Nav/context'
import StepNav from '../StepNav'
import './index.scss'

const baseClass = 'app-header'

export const AppHeader: React.FC = () => {
  const { t } = useTranslation()

  const {
    admin: {
      components: { actionsBar: adminActionsBar },
    },
    localization,
    routes: { admin: adminRoute },
  } = useConfig()

  const location = useLocation()
  const pathSegments = location.pathname.split('/')
  const { isEditView: isCollectionEditView, slug: urlCollectionSlug } = getPathSegmentInfo(
    pathSegments,
    'collections',
  )
  const { isEditView: isGlobalEditView, slug: urlGlobalSlug } = getPathSegmentInfo(
    pathSegments,
    'globals',
    1,
  )

  const { collection, global } = useDocumentInfo()
  const collectionSlug = collection?.slug
  const [collectionConfig] = useCollectionGlobalConfigs(collectionSlug, [urlCollectionSlug])
  const collectionActionsBar = collectionConfig?.admin?.components?.actionsBar ?? []

  const globalSlug = global?.slug
  const [globalConfig] = useCollectionGlobalConfigs(globalSlug, [urlGlobalSlug])
  const globalActionsBar = globalConfig?.admin?.components?.actionsBar ?? []

  const { navOpen } = useNav()

  return (
    <header className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <NavToggler className={`${baseClass}__mobile-nav-toggler`} tabIndex={-1}>
            <Hamburger />
          </NavToggler>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}>
              <StepNav className={`${baseClass}__step-nav`} />
            </div>
            <div className={`${baseClass}__controls`}>
              {Array.isArray(adminActionsBar) &&
                adminActionsBar.map((Component, i) => <Component key={i} />)}
              {isCollectionEditView &&
                Array.isArray(collectionActionsBar) &&
                collectionActionsBar.map((Component, i) => <Component key={i} />)}
              {isGlobalEditView &&
                Array.isArray(globalActionsBar) &&
                globalActionsBar.map((Component, i) => <Component key={i} />)}
              {localization && (
                <LocalizerLabel
                  ariaLabel="invisible"
                  className={`${baseClass}__localizer-spacing`}
                />
              )}
              <Link
                aria-label={t('authentication:account')}
                className={`${baseClass}__account`}
                tabIndex={0}
                to={`${adminRoute}/account`}
              >
                <Account />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
