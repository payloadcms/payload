'use client'
import React, { useState } from 'react'
import type { CompareOption, DefaultVersionsViewProps } from './types'
import {
  Gutter,
  Option,
  formatDate,
  useComponentMap,
  useConfig,
  usePayloadAPI,
  useTranslation,
} from '@payloadcms/ui'
import Restore from '../Restore'
import { mostRecentVersionOption } from '../shared'
import diffComponents from '../RenderFieldsToDiff/fields'
import RenderFieldsToDiff from '../RenderFieldsToDiff'
import { SetStepNav } from './SetStepNav'
import { SelectLocales } from '../SelectLocales'
import { SelectComparison } from '../SelectComparison'

import './index.scss'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  doc,
  mostRecentDoc,
  publishedDoc,
  initialComparisonDoc,
  localeOptions,
  docPermissions,
  collectionSlug,
  globalSlug,
  id,
  versionID,
}) => {
  const config = useConfig()

  const { i18n } = useTranslation()

  const { getFieldMap } = useComponentMap()

  const [fieldMap] = useState(() => getFieldMap({ collectionSlug, globalSlug }))

  const [collectionConfig] = useState(() =>
    config.collections.find((collection) => collection.slug === collectionSlug),
  )

  const [globalConfig] = useState(() => config.globals.find((global) => global.slug === globalSlug))

  const [locales, setLocales] = useState<Option[]>(localeOptions)
  const [compareValue, setCompareValue] = useState<CompareOption>(mostRecentVersionOption)

  const {
    admin: { dateFormat },
    routes: { api: apiRoute },
    localization,
    serverURL,
  } = config

  // useEffect(() => {
  //   const editConfig = (collectionConfig || globalConfig)?.admin?.components?.views?.Edit
  //   const versionActions =
  //     editConfig && 'Version' in editConfig && 'actions' in editConfig.Version
  //       ? editConfig.Version.actions
  //       : []

  //   setViewActions(versionActions)
  // }, [collectionConfig, globalConfig, setViewActions])

  const formattedCreatedAt = doc?.createdAt
    ? formatDate(doc.createdAt, dateFormat, i18n.language)
    : ''

  const originalDocFetchURL = `${serverURL}${apiRoute}${globalSlug ? 'globals/' : ''}/${
    collectionSlug || globalSlug
  }${collectionSlug ? `/${id}` : ''}`

  const compareBaseURL = `${serverURL}${apiRoute}/${globalSlug ? 'globals/' : ''}${
    collectionSlug || globalSlug
  }/versions`

  const compareFetchURL =
    compareValue?.value === 'mostRecent' || compareValue?.value === 'published'
      ? originalDocFetchURL
      : `${compareBaseURL}/${compareValue.value}`

  const [{ data: currentComparisonDoc }] = usePayloadAPI(compareFetchURL, {
    initialParams: { depth: 1, draft: 'true', locale: '*' },
    initialData: initialComparisonDoc,
  })

  const comparison =
    compareValue?.value === 'mostRecent'
      ? mostRecentDoc
      : compareValue?.value === 'published'
      ? publishedDoc
      : currentComparisonDoc?.version // the `version` key is only present on `versions` documents

  const canUpdate = docPermissions?.update?.permission

  return (
    <main className={baseClass}>
      <SetStepNav
        collectionSlug={collectionSlug}
        globalSlug={globalSlug}
        mostRecentDoc={mostRecentDoc}
        doc={doc}
        id={id}
        fieldMap={fieldMap}
        collectionConfig={collectionConfig}
      />
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__header-wrap`}>
          <p className={`${baseClass}__created-at`}>
            {i18n.t('version:versionCreatedOn', {
              version: i18n.t(doc?.autosave ? 'version:autosavedVersion' : 'version:version'),
            })}
          </p>
          <header className={`${baseClass}__header`}>
            <h2>{formattedCreatedAt}</h2>
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collectionSlug={collectionSlug}
                globalSlug={globalSlug}
                label={collectionConfig?.labels.singular || globalConfig?.label}
                originalDocID={id}
                versionDate={formattedCreatedAt}
                versionID={versionID}
              />
            )}
          </header>
        </div>
        <div className={`${baseClass}__controls`}>
          <SelectComparison
            baseURL={compareBaseURL}
            onChange={setCompareValue}
            parentID={id}
            publishedDoc={publishedDoc}
            value={compareValue}
            versionID={versionID}
          />
          {localization && (
            <SelectLocales onChange={setLocales} options={localeOptions} value={locales} />
          )}
        </div>
        {doc?.version && (
          <RenderFieldsToDiff
            comparison={comparison}
            fieldPermissions={docPermissions?.fields}
            fieldMap={fieldMap.filter(({ name }) => name !== 'id')}
            locales={
              locales
                ? locales.map(({ label }) => (typeof label === 'string' ? label : undefined))
                : []
            }
            version={doc?.version}
            i18n={i18n}
            diffComponents={diffComponents}
          />
        )}
      </Gutter>
    </main>
  )
}
