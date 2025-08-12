'use client'

import { Fragment } from 'react'

import { CopyIcon } from '../../icons/Copy/index.js'
import { EditIcon } from '../../icons/Edit/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

export const ClipboardActionLabel = ({
  isPaste,
  isRow,
}: {
  isPaste?: boolean
  isRow?: boolean
}) => {
  const { t } = useTranslation()

  let label = t('general:copyField')
  if (!isRow && isPaste) {
    label = t('general:pasteField')
  } else if (isRow && !isPaste) {
    label = t('general:copyRow')
  } else if (isRow && isPaste) {
    label = t('general:pasteRow')
  }

  return (
    <Fragment>
      {isPaste ? <EditIcon /> : <CopyIcon />} {label}
    </Fragment>
  )
}
