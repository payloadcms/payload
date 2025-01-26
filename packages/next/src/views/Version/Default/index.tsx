'use client'
import type { OptionObject } from 'payload'

import { Gutter, useConfig, useDocumentInfo, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import React, { useEffect, useState } from 'react'

import type { CompareOption, DefaultVersionsViewProps } from './types.js'

import RenderFieldsToDiff from '../RenderFieldsToDiff/index.js'
import Restore from '../Restore/index.js'
import { SelectComparison } from '../SelectComparison/index.js'
import './index.scss'
import { SelectLocales } from '../SelectLocales/index.js'
import { SetStepNav } from './SetStepNav.js'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  doc,
  docPermissions,
  initialComparisonDoc,
  latestDraftVersion,
  latestPublishedVersion,
  localeOptions,
  versionID,
  versionState,
}) => {
  const { config, getEntityConfig } = useConfig()

  const { i18n } = useTranslation()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()

  const [collectionConfig] = useState(() => getEntityConfig({ collectionSlug }))

  const [globalConfig] = useState(() => getEntityConfig({ globalSlug }))

  const [locales, setLocales] = useState<OptionObject[]>(localeOptions)

  const [compareValue, setCompareValue] = useState<CompareOption>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If compareValue changes, update url params
    const current = new URLSearchParams(Array.from(searchParams.entries())) // -> has to use this form

    if (!compareValue) {
      current.delete('compareValue')
    } else {
      current.set('compareValue', compareValue?.value)
    }
    if (!locales) {
      current.delete('localeCodes')
    } else {
      current.set('localeCodes', JSON.stringify(locales.map((locale) => locale.value)))
    }

    // cast to string
    const search = current.toString()
    // or const query = `${'?'.repeat(search.length && 1)}${search}`;
    const query = search ? `?${search}` : ''

    router.push(`${pathname}${query}`)
  }, [compareValue, pathname, router, searchParams, locales])

  const {
    admin: { dateFormat },
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const versionCreatedAt = doc?.updatedAt
    ? formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })
    : ''

  const compareBaseURL = `${serverURL}${apiRoute}/${globalSlug ? 'globals/' : ''}${
    collectionSlug || globalSlug
  }/versions`

  const canUpdate = docPermissions?.update

  const draftsEnabled = Boolean((collectionConfig || globalConfig)?.versions.drafts)

  return (
    <main className={baseClass}>
      <SetStepNav
        collectionConfig={collectionConfig}
        collectionSlug={collectionSlug}
        doc={doc}
        fields={(collectionConfig || globalConfig)?.fields}
        globalConfig={globalConfig}
        globalSlug={globalSlug}
        id={id}
      />
      <Gutter className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__header-wrap`}>
          <p className={`${baseClass}__created-at`}>
            {i18n.t('version:versionCreatedOn', {
              version: i18n.t(doc?.autosave ? 'version:autosavedVersion' : 'version:version'),
            })}
          </p>
          <header className={`${baseClass}__header`}>
            <h2>{versionCreatedAt}</h2>
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collectionSlug={collectionSlug}
                globalSlug={globalSlug}
                label={collectionConfig?.labels.singular || globalConfig?.label}
                originalDocID={id}
                status={doc?.version?._status}
                versionDate={versionCreatedAt}
                versionID={versionID}
              />
            )}
          </header>
        </div>
        <div className={`${baseClass}__controls`}>
          <SelectComparison
            baseURL={compareBaseURL}
            draftsEnabled={draftsEnabled}
            latestDraftVersion={latestDraftVersion}
            latestPublishedVersion={latestPublishedVersion}
            onChange={setCompareValue}
            parentID={id}
            value={compareValue}
            versionID={versionID}
          />
          {localization && (
            <SelectLocales onChange={setLocales} options={localeOptions} value={locales} />
          )}
        </div>
        {doc?.version && <RenderFieldsToDiff fields={versionState.versionFields} />}
      </Gutter>
    </main>
  )
}
