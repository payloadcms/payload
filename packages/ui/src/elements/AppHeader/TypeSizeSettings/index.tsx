'use client'
import React from 'react'

import type { TypeSize } from '../../../providers/Theme/shared.js'

import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { PopupList } from '../../Popup/index.js'

export const TypeSizeSettings: React.FC = () => {
  const { setTypeSize, typeSize } = useTheme()
  const { t } = useTranslation()
  const options: { label: string; value: TypeSize }[] = [
    { label: t('general:typeSizeSmall'), value: 'small' },
    { label: t('general:typeSizeDefault'), value: 'default' },
    { label: t('general:typeSizeLarge'), value: 'large' },
  ]

  return (
    <div aria-label={t('general:typeSizes')} data-popup-prevent-close role="group">
      <PopupList.GroupLabel label={t('general:typeSizes')} />
      <PopupList.RadioGroup>
        {options.map(({ label, value }) => (
          <PopupList.RadioGroupItem
            active={typeSize === value}
            key={value}
            onClick={() => setTypeSize({ typeSize: value })}
          >
            {label}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  )
}
