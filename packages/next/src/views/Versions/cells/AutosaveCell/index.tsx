'use client'
import { Pill, useTableCell, useTranslation } from '@payloadcms/ui/client'
import React, { Fragment } from 'react'

export const AutosaveCell: React.FC = () => {
  const { t } = useTranslation()

  const { rowData } = useTableCell()
  return (
    <Fragment>
      {rowData?.autosave && (
        <React.Fragment>
          <Pill>{t('version:autosave')}</Pill>
          &nbsp;&nbsp;
        </React.Fragment>
      )}
      {rowData?.version._status === 'published' && (
        <React.Fragment>
          <Pill pillStyle="success">{t('version:published')}</Pill>
          &nbsp;&nbsp;
        </React.Fragment>
      )}
      {rowData?.version._status === 'draft' && <Pill>{t('version:draft')}</Pill>}
    </Fragment>
  )
}
