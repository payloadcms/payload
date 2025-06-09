'use client'

import type { PaginatedDocs, Where } from 'payload'

import {
  fieldBaseClass,
  ReactSelect,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import { stringify } from 'qs-esm'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types.js'

import './index.scss'
import { formatVersionPill } from '../VersionPillLabel/formatVersionPill.js'

const baseClass = 'compare-version'

const maxResultsPerRequest = 10

export const SelectComparison: React.FC<Props> = (props) => {
  const {
    baseURL,
    draftsEnabled,
    latestDraftVersionID,
    latestPublishedVersionID,
    onChange,
    parentID,
    versionFromOption,
    versionToID,
  } = props
  const { i18n, t } = useTranslation()

  const {
    config: { localization },
  } = useConfig()

  const { hasPublishedDoc } = useDocumentInfo()

  const [options, setOptions] = useState<
    {
      label: React.ReactNode | string
      value: string
    }[]
  >([])

  const [lastLoadedPage, setLastLoadedPage] = useState(1)
  const [errorLoading, setErrorLoading] = useState('')
  const loadedAllOptionsRef = React.useRef(false)

  const getResults = useCallback(
    async ({ lastLoadedPage: lastLoadedPageArg }) => {
      if (loadedAllOptionsRef.current) {
        return
      }
      const query: {
        [key: string]: unknown
        where: Where
      } = {
        depth: 0,
        limit: maxResultsPerRequest,
        page: lastLoadedPageArg,
        where: {
          and: [
            {
              id: {
                not_equals: versionToID,
              },
            },
          ],
        },
      }

      if (parentID) {
        query.where.and.push({
          parent: {
            equals: parentID,
          },
        })
      }

      if (localization && draftsEnabled) {
        query.where.and.push({
          snapshot: {
            not_equals: true,
          },
        })
      }

      const search = stringify(query)

      const response = await fetch(`${baseURL}?${search}`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      if (response.ok) {
        const data: PaginatedDocs = await response.json()

        if (data.docs.length > 0) {
          const additionalOptions = data.docs.map((doc) => {
            const pill = formatVersionPill({
              doc,
              hasPublishedDoc,
              labelFirst: true,
              labelStyle: 'text',
              latestDraftVersionID,
              latestPublishedVersionID,
            })

            return {
              label: pill.Label,
              value: pill.id,
            }
          })

          setOptions((existingOptions) =>
            [...existingOptions, ...additionalOptions].filter(
              (option, index, self) => self.findIndex((t) => t.value === option.value) === index,
            ),
          )

          if (!data.hasNextPage) {
            loadedAllOptionsRef.current = true
          }
          setLastLoadedPage(data.page)
        }
      } else {
        setErrorLoading(t('error:unspecific'))
      }
    },
    [
      versionToID,
      parentID,
      localization,
      draftsEnabled,
      baseURL,
      i18n.language,
      hasPublishedDoc,
      latestDraftVersionID,
      latestPublishedVersionID,
      t,
    ],
  )

  useEffect(() => {
    if (!i18n.dateFNS) {
      // If dateFNS is not loaded, we can't format the date in getResults
      return
    }
    void getResults({ lastLoadedPage: 1 })
  }, [getResults, i18n.dateFNS])

  useEffect(() => {
    if (options.length > 0 && !versionFromOption) {
      onChange(options[0])
    }
  }, [options, versionFromOption, onChange])

  return (
    <div
      className={[fieldBaseClass, baseClass, errorLoading && 'error-loading']
        .filter(Boolean)
        .join(' ')}
    >
      {!errorLoading && (
        <ReactSelect
          isClearable={false}
          isSearchable={false}
          onChange={onChange}
          onMenuScrollToBottom={() => {
            void getResults({ lastLoadedPage: lastLoadedPage + 1 })
          }}
          options={options}
          placeholder={t('version:selectVersionToCompare')}
          value={versionFromOption}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}
