'use client'
import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Pill } from '../../../'

type AutosaveCellProps = {
  latestDraftVersion?: string
  latestPublishedVersion?: string
  rowData: any
}

export const renderPill = (data, latestVersion, currentLabel, previousLabel, pillStyle) => {
  return (
    <React.Fragment>
      {data?.id === latestVersion ? (
        <Pill pillStyle={pillStyle}>{currentLabel}</Pill>
      ) : (
        <Pill>{previousLabel}</Pill>
      )}
      &nbsp;&nbsp;
    </React.Fragment>
  )
}

export const AutosaveCell: React.FC<AutosaveCellProps> = ({
  latestDraftVersion,
  latestPublishedVersion,
  rowData,
}) => {
  const { t } = useTranslation()
  const status = rowData?.version._status

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

  const { currentLabel, latestVersion, pillStyle, previousLabel } = versionInfo[status] || {}

  return (
    <Fragment>
      {rowData?.autosave && (
        <React.Fragment>
          <Pill>{t('version:autosave')}</Pill>
          &nbsp;&nbsp;
        </React.Fragment>
      )}
      {status && renderPill(rowData, latestVersion, currentLabel, previousLabel, pillStyle)}
    </Fragment>
  )
}
