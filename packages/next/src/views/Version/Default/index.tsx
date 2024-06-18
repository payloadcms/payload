'use client'
import type { OptionObject } from 'payload'

import {
  Gutter,
  SetViewActions,
  useComponentMap,
  useConfig,
  useDocumentInfo,
  usePayloadAPI,
  useTranslation,
} from '@payloadcms/ui/client'
import { formatDate } from '@payloadcms/ui/shared'
import React, { useState } from 'react'

import type { CompareOption, DefaultVersionsViewProps } from './types.js'

import diffComponents from '../RenderFieldsToDiff/fields/index.js'
import RenderFieldsToDiff from '../RenderFieldsToDiff/index.js'
import Restore from '../Restore/index.js'
import { SelectComparison } from '../SelectComparison/index.js'
import { SelectLocales } from '../SelectLocales/index.js'
import { mostRecentVersionOption } from '../shared.js'
import { SetStepNav } from './SetStepNav.js'
import './index.scss'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  doc,
  docPermissions,
  initialComparisonDoc,
  localeOptions,
  mostRecentDoc,
  publishedDoc,
  versionID,
}) => {
  const config = useConfig()

  const { i18n } = useTranslation()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const { getComponentMap, getFieldMap } = useComponentMap()

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  const [fieldMap] = useState(() => getFieldMap({ collectionSlug, globalSlug }))

  const [collectionConfig] = useState(() =>
    config.collections.find((collection) => collection.slug === collectionSlug),
  )

  const [globalConfig] = useState(() => config.globals.find((global) => global.slug === globalSlug))

  const [locales, setLocales] = useState<OptionObject[]>(localeOptions)
  const [compareValue, setCompareValue] = useState<CompareOption>(mostRecentVersionOption)

  const {
    admin: { dateFormat },
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const formattedCreatedAt = doc?.createdAt
    ? formatDate({ date: doc.createdAt, i18n, pattern: dateFormat })
    : ''

  const originalDocFetchURL = `${serverURL}${apiRoute}/${globalSlug ? 'globals/' : ''}${
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
    initialData: initialComparisonDoc,
    initialParams: { depth: 1, draft: 'true', locale: '*' },
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
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.Version} />
      <SetStepNav
        collectionConfig={collectionConfig}
        collectionSlug={collectionSlug}
        doc={doc}
        fieldMap={fieldMap}
        globalConfig={globalConfig}
        globalSlug={globalSlug}
        id={id}
        mostRecentDoc={mostRecentDoc}
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
            diffComponents={diffComponents}
            fieldMap={fieldMap}
            fieldPermissions={docPermissions?.fields}
            i18n={i18n}
            locales={
              locales
                ? locales.map(({ label }) => (typeof label === 'string' ? label : undefined))
                : []
            }
            version={
              globalConfig
                ? {
                    ...doc?.version,
                    createdAt: doc?.version?.createdAt || doc.createdAt,
                    updatedAt: doc?.version?.updatedAt || doc.updatedAt,
                  }
                : doc?.version
            }
          />
        )}
      </Gutter>
    </main>
  )
}
