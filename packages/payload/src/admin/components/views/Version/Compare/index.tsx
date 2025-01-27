import qs from 'qs'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PaginatedDocs } from '../../../../../database/types'
import type { Where } from '../../../../../types'
import type { Props } from './types'

import { formatDate } from '../../../../utilities/formatDate'
import ReactSelect from '../../../elements/ReactSelect'
import { fieldBaseClass } from '../../../forms/field-types/shared'
import { useConfig } from '../../../utilities/Config'
import { renderPill } from '../../Versions/cells/AutosaveCell'
import './index.scss'

const baseClass = 'compare-version'

const maxResultsPerRequest = 100

const baseOptions = []

const CompareVersion: React.FC<Props> = (props) => {
  const {
    baseURL,
    latestDraftVersion,
    latestPublishedVersion,
    onChange,
    parentID,
    value,
    versionID,
  } = props

  const {
    admin: { dateFormat },
  } = useConfig()

  const [options, setOptions] = useState(baseOptions)
  const [lastLoadedPage, setLastLoadedPage] = useState(1)
  const [errorLoading, setErrorLoading] = useState('')
  const { i18n, t } = useTranslation('version')

  const getResults = useCallback(
    async ({ lastLoadedPage: lastLoadedPageArg }) => {
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
                not_equals: versionID,
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

      const search = qs.stringify(query)
      const response = await fetch(`${baseURL}?${search}`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      if (response.ok) {
        const data: PaginatedDocs = await response.json()
        if (data.docs.length > 0) {
          const versionInfo = {
            draft: {
              currentLabel: t('version:currentDraft'),
              latestVersion: latestDraftVersion,
              pillStyle: undefined,
              previousLabel: t('version:draft'),
            },
            published: {
              currentLabel: t('version:currentPublishedVersion'),
              latestVersion: latestPublishedVersion,
              pillStyle: 'success',
              previousLabel: t('version:previouslyPublished'),
            },
          }

          const additionalOptions = data.docs.map((doc) => {
            const status = doc.version._status
            const { currentLabel, latestVersion, pillStyle, previousLabel } =
              versionInfo[status] || {}

            return {
              label: (
                <div>
                  {formatDate(doc.updatedAt, dateFormat, i18n?.language)}
                  &nbsp;&nbsp;
                  {renderPill(doc, latestVersion, currentLabel, previousLabel, pillStyle)}
                </div>
              ),
              value: doc.id,
            }
          })

          setOptions(additionalOptions)
          setLastLoadedPage(data.page)
        }
      } else {
        setErrorLoading(t('error:unspecific'))
      }
    },
    [dateFormat, baseURL, parentID, versionID, t, i18n, latestDraftVersion, latestPublishedVersion],
  )

  useEffect(() => {
    void getResults({ lastLoadedPage: 1 })
  }, [getResults])

  const filteredOptions = options.filter(
    (option, index, self) => self.findIndex((t) => t.value === option.value) === index,
  )

  useEffect(() => {
    if (filteredOptions.length > 0 && !value) {
      onChange(filteredOptions[0])
    }
  }, [filteredOptions, value, onChange])

  return (
    <div
      className={[fieldBaseClass, baseClass, errorLoading && 'error-loading']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__label`}>{t('compareVersion')}</div>
      {!errorLoading && (
        <ReactSelect
          isClearable={false}
          isSearchable={false}
          onChange={onChange}
          onMenuScrollToBottom={() => {
            void getResults({ lastLoadedPage: lastLoadedPage + 1 })
          }}
          options={filteredOptions}
          placeholder={t('selectVersionToCompare')}
          value={value}
        />
      )}
      {errorLoading && <div className={`${baseClass}__error-loading`}>{errorLoading}</div>}
    </div>
  )
}

export default CompareVersion
