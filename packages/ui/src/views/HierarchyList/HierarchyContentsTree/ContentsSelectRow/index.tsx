'use client'

import React from 'react'

import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { useDocumentSelection } from '../../../../providers/DocumentSelection/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'

export function ContentsSelectRow({
  id,
  collectionSlug,
  title,
}: {
  collectionSlug: string
  id: number | string
  title: string
}) {
  const { isLocked, isSelected, toggleSelection } = useDocumentSelection()
  const { t } = useTranslation()
  const hasLock = isLocked({ id, collectionSlug })

  return (
    <CheckboxInput
      aria-label={t('general:selectLabel', { label: title })}
      checked={isSelected({ id, collectionSlug })}
      className="select-row select-row__checkbox"
      onToggle={() => toggleSelection({ id, collectionSlug })}
      readOnly={hasLock}
      tooltip={hasLock ? `${t('general:anotherUser')} ${t('general:isEditing')}` : undefined}
      variant="muted"
    />
  )
}
