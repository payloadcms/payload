'use client'

import {
  CheckboxInput,
  ChevronIcon,
  formatTimeToNow,
  Gutter,
  Pill,
  type SelectablePill,
  useConfig,
  useDocumentInfo,
  useLocale,
  useRouteTransition,
  useTranslation,
} from '@ruya.sa/ui'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import React, { type FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react'

import type { CompareOption, DefaultVersionsViewProps } from './types.js'

import { Restore } from '../Restore/index.js'
import './index.scss'
import { SelectComparison } from '../SelectComparison/index.js'
import { type SelectedLocaleOnChange, SelectLocales } from '../SelectLocales/index.js'
import { SelectedLocalesContext } from './SelectedLocalesContext.js'
import { SetStepNav } from './SetStepNav.js'

const baseClass = 'view-version'

export const DefaultVersionView: React.FC<DefaultVersionsViewProps> = ({
  canUpdate,
  modifiedOnly: modifiedOnlyProp,
  RenderedDiff,
  selectedLocales: selectedLocalesFromProps,
  versionFromCreatedAt,
  versionFromID,
  versionFromOptions,
  versionToCreatedAt,
  versionToCreatedAtFormatted,
  VersionToCreatedAtLabel,
  versionToID,
  versionToStatus,
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

  const { id: originalDocID, collectionSlug, globalSlug, isTrashed } = useDocumentInfo()
  const { startRouteTransition } = useRouteTransition()

  const { collectionConfig, globalConfig } = useMemo(() => {
    return {
      collectionConfig: getEntityConfig({ collectionSlug }),
      globalConfig: getEntityConfig({ globalSlug }),
    }
  }, [collectionSlug, globalSlug, getEntityConfig])

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

  const { localization } = config

  const versionToTimeAgo = useMemo(
    () =>
      t('version:versionAgo', {
        distance: formatTimeToNow({
          date: versionToCreatedAt,
          i18n,
        }),
      }),
    [versionToCreatedAt, i18n, t],
  )

  const versionFromTimeAgo = useMemo(
    () =>
      versionFromCreatedAt
        ? t('version:versionAgo', {
            distance: formatTimeToNow({
              date: versionFromCreatedAt,
              i18n,
            }),
          })
        : undefined,
    [versionFromCreatedAt, i18n, t],
  )

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
                size="small"
              >
                <span className={`${baseClass}__toggle-locales-label`}>
                  {t('general:locales')}:{' '}
                </span>
                <span className={`${baseClass}__toggle-locales-list`}>
                  {locales
                    .filter((locale) => locale.selected)
                    .map((locale) => locale.name)
                    .join(', ')}
                </span>
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
          <div className={`${baseClass}__version-from`}>
            <div className={`${baseClass}__version-from-labels`}>
              <span>{t('version:comparingAgainst')}</span>
              {versionFromTimeAgo && (
                <span className={`${baseClass}__time-elapsed`}>{versionFromTimeAgo}</span>
              )}
            </div>
            <SelectComparison
              collectionSlug={collectionSlug}
              docID={originalDocID}
              globalSlug={globalSlug}
              onChange={onChangeVersionFrom}
              versionFromID={versionFromID}
              versionFromOptions={versionFromOptions}
            />
          </div>

          <div className={`${baseClass}__version-to`}>
            <div className={`${baseClass}__version-to-labels`}>
              <span>{t('version:currentlyViewing')}</span>
              <span className={`${baseClass}__time-elapsed`}>{versionToTimeAgo}</span>
            </div>
            <div className={`${baseClass}__version-to-version`}>
              {VersionToCreatedAtLabel}
              {canUpdate && !isTrashed && (
                <Restore
                  className={`${baseClass}__restore`}
                  collectionConfig={collectionConfig}
                  globalConfig={globalConfig}
                  label={collectionConfig?.labels.singular || globalConfig?.label}
                  originalDocID={originalDocID}
                  status={versionToStatus}
                  versionDateFormatted={versionToCreatedAtFormatted}
                  versionID={versionToID}
                />
              )}
            </div>
          </div>
        </div>
      </Gutter>
      <SetStepNav
        collectionConfig={collectionConfig}
        globalConfig={globalConfig}
        id={originalDocID}
        isTrashed={isTrashed}
        versionToCreatedAtFormatted={versionToCreatedAtFormatted}
        versionToID={versionToID}
      />
      <Gutter className={`${baseClass}__diff-wrap`}>
        <SelectedLocalesContext value={{ selectedLocales: locales.map((locale) => locale.name) }}>
          {versionToCreatedAt && RenderedDiff}
        </SelectedLocalesContext>
      </Gutter>
    </main>
  )
}
