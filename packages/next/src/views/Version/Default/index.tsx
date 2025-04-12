'use client'

import {
  CheckboxInput,
  ChevronIcon,
  Gutter,
  Pill,
  type SelectablePill,
  useConfig,
  useDocumentInfo,
  useLocale,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import React, { type FormEventHandler, useCallback, useEffect, useState } from 'react'

import type { CompareOption, DefaultVersionsViewProps } from './types.js'

import Restore from '../Restore/index.js'
import { SelectComparison } from '../SelectComparison/index.js'
import './index.scss'
import { type SelectedLocaleOnChange, SelectLocales } from '../SelectLocales/index.js'
import { SelectedLocalesContext } from './SelectedLocalesContext.js'
import { SetStepNav } from './SetStepNav.js'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  canUpdate,
  latestDraftVersionID,
  latestPublishedVersionID,
  modifiedOnly: modifiedOnlyProp,
  RenderedDiff,
  selectedLocales: selectedLocalesFromProps,
  versionFromPill,
  versionTo,
  versionToCreatedAt,
  VersionToCreatedAtLabel,
}) => {
  const { config, getEntityConfig } = useConfig()
  const { code } = useLocale()
  const { i18n, t } = useTranslation()

  const [locales, setLocales] = useState<SelectablePill[]>([])
  const [localeSelectorOpen, setLocaleSelectorOpen] = React.useState(false)

  useEffect(() => {
    if (config.localization) {
      const updatedLocales = config.localization.locales.map((locale) => {
        let label = locale.label
        if (typeof locale.label !== 'string' && locale.label[code]) {
          label = locale.label[code]
        }

        return {
          name: locale.code,
          Label: label,
          selected: selectedLocalesFromProps.includes(locale.code),
        } as SelectablePill
      })
      setLocales(updatedLocales)
    }
  }, [code, config.localization, selectedLocalesFromProps])

  const { id: originalDocID, collectionSlug, globalSlug } = useDocumentInfo()
  const { startRouteTransition } = useRouteTransition()

  const [collectionConfig] = useState(() => getEntityConfig({ collectionSlug }))

  const [globalConfig] = useState(() => getEntityConfig({ globalSlug }))

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [modifiedOnly, setModifiedOnly] = useState(modifiedOnlyProp)

  const updateSearchParams = useCallback(
    (args: {
      modifiedOnly?: boolean
      selectedLocales?: SelectablePill[]
      versionFromID?: string
    }) => {
      // If the selected comparison doc or locales change, update URL params so that version page
      // This is so that RSC can update the version comparison state
      const current = new URLSearchParams(Array.from(searchParams.entries()))

      if (args?.versionFromID) {
        current.set('versionFrom', args?.versionFromID)
      }

      if (args?.selectedLocales) {
        if (!args.selectedLocales.length) {
          current.delete('localeCodes')
        } else {
          const selectedLocaleCodes: string[] = []
          for (const locale of args.selectedLocales) {
            if (locale.selected) {
              selectedLocaleCodes.push(locale.name)
            }
          }
          current.set('localeCodes', JSON.stringify(selectedLocaleCodes))
        }
      }

      if (args?.modifiedOnly === false) {
        current.set('modifiedOnly', 'false')
      } else if (args?.modifiedOnly === true) {
        current.delete('modifiedOnly')
      }

      const search = current.toString()
      const query = search ? `?${search}` : ''

      startRouteTransition(() => router.push(`${pathname}${query}`))
    },
    [pathname, router, searchParams, startRouteTransition],
  )

  const onToggleModifiedOnly: FormEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const newModified = (event.target as HTMLInputElement).checked
      setModifiedOnly(newModified)

      updateSearchParams({
        modifiedOnly: newModified,
      })
    },
    [updateSearchParams],
  )

  const onChangeSelectedLocales: SelectedLocaleOnChange = useCallback(
    ({ locales }) => {
      setLocales(locales)
      updateSearchParams({
        selectedLocales: locales,
      })
    },
    [updateSearchParams],
  )

  const onChangeVersionFrom: (val: CompareOption) => void = useCallback(
    (val) => {
      updateSearchParams({
        versionFromID: val.value,
      })
    },
    [updateSearchParams],
  )

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const compareBaseURL = `${serverURL}${apiRoute}/${globalSlug ? 'globals/' : ''}${
    collectionSlug || globalSlug
  }/versions`

  const draftsEnabled = Boolean((collectionConfig || globalConfig)?.versions.drafts)

  return (
    <main className={baseClass}>
      <Gutter className={`${baseClass}-controls-top`}>
        <div className={`${baseClass}-controls-top__wrapper`}>
          <h2>{i18n.t('version:compareVersions')}</h2>
          <div className={`${baseClass}-controls-top__wrapper-actions`}>
            <span className={`${baseClass}__modifiedCheckBox`}>
              <CheckboxInput
                checked={modifiedOnly}
                id={'modifiedOnly'}
                label={i18n.t('version:modifiedOnly')}
                onToggle={onToggleModifiedOnly}
              />
            </span>
            {localization && (
              <Pill
                aria-controls={`${baseClass}-locales`}
                aria-expanded={localeSelectorOpen}
                className={`${baseClass}__toggle-locales`}
                icon={<ChevronIcon direction={localeSelectorOpen ? 'up' : 'down'} />}
                onClick={() => setLocaleSelectorOpen((localeSelectorOpen) => !localeSelectorOpen)}
                pillStyle="light"
              >
                {t('general:locales')}
              </Pill>
            )}
          </div>
        </div>

        {localization && (
          <SelectLocales
            locales={locales}
            localeSelectorOpen={localeSelectorOpen}
            onChange={onChangeSelectedLocales}
          />
        )}
      </Gutter>
      <Gutter className={`${baseClass}-controls-bottom`}>
        <div className={`${baseClass}-controls-bottom__wrapper`}>
          <div className={`${baseClass}-controls-bottom__version-from`}>
            <SelectComparison
              baseURL={compareBaseURL}
              draftsEnabled={draftsEnabled}
              latestDraftVersionID={latestDraftVersionID}
              latestPublishedVersionID={latestPublishedVersionID}
              onChange={onChangeVersionFrom}
              parentID={originalDocID}
              versionFromOption={{
                label: versionFromPill.Label,
                value: versionFromPill.id,
              }}
              versionToID={versionTo.id}
            />
          </div>

          <div className={`${baseClass}-controls-bottom__version-to`}>
            {VersionToCreatedAtLabel}
            {canUpdate && (
              <Restore
                className={`${baseClass}__restore`}
                collectionSlug={collectionSlug}
                globalSlug={globalSlug}
                label={collectionConfig?.labels.singular || globalConfig?.label}
                originalDocID={originalDocID}
                status={versionTo?.version?._status}
                versionDate={versionToCreatedAt}
                versionID={versionTo?.id}
              />
            )}
          </div>
        </div>
      </Gutter>
      <SetStepNav
        collectionConfig={collectionConfig}
        collectionSlug={collectionSlug}
        doc={versionTo}
        fields={(collectionConfig || globalConfig)?.fields}
        globalConfig={globalConfig}
        globalSlug={globalSlug}
        id={originalDocID}
      />
      <Gutter className={`${baseClass}__diff-wrap`}>
        <SelectedLocalesContext value={{ selectedLocales: locales.map((locale) => locale.name) }}>
          {versionTo?.version && RenderedDiff}
        </SelectedLocalesContext>
      </Gutter>
    </main>
  )
}
