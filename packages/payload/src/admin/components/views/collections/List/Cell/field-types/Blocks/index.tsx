import React from 'react'
import { useTranslation } from 'react-i18next'

import type { BlockField } from '../../../../../../../../fields/config/types'
import type { CellComponentProps } from '../../types'

import { getTranslation } from '../../../../../../../../utilities/getTranslation'

const BlocksCell: React.FC<CellComponentProps<BlockField, any>> = ({ data, field }) => {
  const { i18n, t } = useTranslation('fields')
  const selectedBlocks = data ? data.map(({ blockType }) => blockType) : []
  const blockLabels = field.blocks.map((s) => ({
    label: getTranslation(s.labels.singular, i18n),
    slug: s.slug,
  }))

  let label = `0 ${getTranslation(field.labels.plural, i18n)}`

  const formatBlockList = (blocks) =>
    blocks
      .map((b) => {
        const filtered = blockLabels.filter((f) => f.slug === b)?.[0]
        return filtered?.label
      })
      .join(', ')

  const itemsToShow = 5
  if (selectedBlocks.length > itemsToShow) {
    const more = selectedBlocks.length - itemsToShow
    label = `${selectedBlocks.length} ${getTranslation(field.labels.plural, i18n)} - ${t(
      'fields:itemsAndMore',
      { count: more, items: formatBlockList(selectedBlocks.slice(0, itemsToShow)) },
    )}`
  } else if (selectedBlocks.length > 0) {
    label = `${selectedBlocks.length} ${getTranslation(
      selectedBlocks.length === 1 ? field.labels.singular : field.labels.plural,
      i18n,
    )} - ${formatBlockList(selectedBlocks)}`
  }

  return <span>{label}</span>
}
export default BlocksCell
