'use client'
import React from 'react'

import type { EditViewAlignment, EditViewWidth } from '../../../providers/Theme/shared.js'

import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { PopupList } from '../../Popup/index.js'

const widths: EditViewWidth[] = ['960', '1200', '1440', 'full']
const alignments: EditViewAlignment[] = ['left', 'center', 'center-all']

export const EditViewWidthSettings: React.FC = () => {
  const { editViewAlignment, editViewWidth, setEditViewAlignment, setEditViewWidth } = useTheme()
  const { t } = useTranslation()

  return (
    <div aria-label={t('general:editViewWidth')} data-popup-prevent-close role="group">
      <PopupList.GroupLabel label={t('general:editViewWidth')} />
      <PopupList.RadioGroup>
        {widths.map((width) => (
          <PopupList.RadioGroupItem
            active={editViewWidth === width}
            key={width}
            onClick={() => setEditViewWidth({ editViewWidth: width })}
          >
            {width === 'full' ? t('general:editViewWidthFull') : `${width}px`}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
      <PopupList.GroupLabel label={t('general:editViewAlignment')} />
      <PopupList.RadioGroup>
        {alignments.map((alignment) => (
          <PopupList.RadioGroupItem
            active={editViewAlignment === alignment}
            key={alignment}
            onClick={() => setEditViewAlignment({ editViewAlignment: alignment })}
          >
            {alignment === 'left'
              ? t('general:editViewAlignmentLeft')
              : alignment === 'center'
                ? t('general:editViewAlignmentCentered')
                : t('general:editViewAlignmentCenterAll')}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  )
}
