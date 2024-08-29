import React from 'react'

import { useSelection } from '../../providers/Selection/index.js'
// import { useTranslation } from '../../providers/Translation/index.js'
import { Pill } from '../Pill/index.js'

export const SelectMany: React.FC<{
  onClick?: (ids: ReturnType<typeof useSelection>['selected']) => void
}> = (props) => {
  const { onClick } = props

  const { count, selected } = useSelection()
  // const { t } = useTranslation()

  if (!selected || !count) {
    return null
  }

  return (
    <Pill
      // className={`${baseClass}__toggle`}
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick(selected)
        }
      }}
      pillStyle="white"
    >
      {`Select ${count}`}
    </Pill>
  )
}
