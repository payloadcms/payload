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

const hasActions = (viewConfig): viewConfig is { actions: React.ComponentType<any>[] } => {
  return typeof viewConfig === 'object' && viewConfig !== null && 'actions' in viewConfig
}

export const AppHeader: React.FC = () => {
  const { t } = useTranslation()

  const {
    admin: {
      components: { actions: adminActions },
    },
    localization,
    routes: { admin: adminRoute },
  } = useConfig()

  const location = useLocation()
  const pathSegments = location.pathname.split('/')

  const { collection, global } = useDocumentInfo()
  const [collectionConfig] = useCollectionGlobalConfigs(collection?.slug, [collection?.slug])
  const [globalConfig] = useCollectionGlobalConfigs(global?.slug, [global?.slug])

  const isSanitizedConfig = (config) => config?.admin?.components?.views

  const getActions = (config, pathType) => {
    if (!isSanitizedConfig(config)) return []
    const pathInfo = getPathSegmentInfo(pathSegments, pathType)

    if (
      pathInfo.isListView &&
      config.admin.components.views.List &&
      hasActions(config.admin.components.views.List)
    ) {
      return config.admin.components.views.List.actions
    }

    const editViews = config.admin.components.views.Edit

    let actions = []
    if (pathInfo.isAPIView && hasActions(editViews.API)) {
      actions = editViews.API.actions
    } else if (pathInfo.isEditView && hasActions(editViews.Default)) {
      actions = editViews.Default.actions
    } else if (pathInfo.isLivePreviewView && hasActions(editViews.LivePreview)) {
      actions = editViews.LivePreview.actions
    } else if (pathInfo.isVersionView && hasActions(editViews.Version)) {
      actions = editViews.Version.actions
    } else if (pathInfo.isVersionsView && hasActions(editViews.Versions)) {
      actions = editViews.Versions.actions
    }

    return actions ?? []
  }

  const collectionActions = getActions(collectionConfig, 'collections')
  const globalActions = getActions(globalConfig, 'globals')

  const isGlobalView = globalActions.length > 0
  const isCollectionView = collectionActions.length > 0

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
              <div className={`${baseClass}__custom-controls`}>
                {Boolean(isGlobalView) &&
                  Array.isArray(globalActions) &&
                  globalActions.map((Component, i) => <Component key={i} />)}
                {Boolean(isCollectionView) &&
                  Array.isArray(collectionActions) &&
                  collectionActions.map((Component, i) => <Component key={i} />)}
                {Array.isArray(adminActions) &&
                  adminActions.map((Component, i) => <Component key={i} />)}
              </div>
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
