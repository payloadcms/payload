import React from 'react'

import { useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'

export const SelectMany: React.FC<{
  onClick?: (ids: ReturnType<typeof useSelection>['selected']) => void
}> = (props) => {
  const { onClick } = props

  const { count, selected } = useSelection()
  const { t } = useTranslation()

  if (!selected || !count) {
    return null
  }

  return (
    <Button
      buttonStyle="primary"
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick(selected)
        }
      }}
      size="medium"
    >
      {t('general:select')} {count}
    </Button>
  )
}
