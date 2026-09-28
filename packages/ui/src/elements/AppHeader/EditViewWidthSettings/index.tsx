'use client'
import React from 'react'

import type { EditViewWidth } from '../../../providers/Theme/shared.js'

import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { PopupList } from '../../Popup/index.js'
import { Switch } from '../../Switch/index.js'
import './index.css'

const widths: EditViewWidth[] = ['960', '1200', '1440', 'full']

export const EditViewWidthSettings: React.FC = () => {
  const {
    editViewWidth,
    setEditViewHeaderAlignment,
    setEditViewWidth,
    setListViewMaxWidth,
    shouldAlignEditViewHeader,
    shouldApplyListViewMaxWidth,
  } = useTheme()
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
      <Switch
        checked={shouldApplyListViewMaxWidth}
        className="edit-view-width-settings__list-views"
        label={`${t('general:editViewWidth')}: ${t('dashboard:listView')}`}
        onChange={(isEnabled) => setListViewMaxWidth({ isEnabled })}
      />
      <Switch
        checked={shouldAlignEditViewHeader}
        className="edit-view-width-settings__alignment"
        label={t('general:alignHeaderAndControls')}
        onChange={(isEnabled) => setEditViewHeaderAlignment({ isEnabled })}
      />
    </div>
  )
}
