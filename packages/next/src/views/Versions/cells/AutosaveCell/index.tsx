'use client'
import { Pill } from '@payloadcms/ui/elements/Pill'
import { useTableCell } from '@payloadcms/ui/elements/Table'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { Fragment } from 'react'

export const AutosaveCell: React.FC = () => {
  const { t } = useTranslation()

  const { rowData } = useTableCell()

  return (
    <Fragment>
      {rowData?.autosave && (
        <React.Fragment>
          <Pill>
            Autosave
            {t('version:autosave')}
          </Pill>
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
