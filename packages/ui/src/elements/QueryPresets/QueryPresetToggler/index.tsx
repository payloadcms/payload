'use client'
import type { QueryPreset } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { PeopleIcon } from '../../../icons/People/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Chip } from '../../Chip/index.js'
import './index.scss'

const baseClass = 'active-query-preset'

export function QueryPresetToggler({
  activePreset,
  openPresetListDrawer,
  resetPreset,
}: {
  activePreset: QueryPreset
  openPresetListDrawer: () => void
  resetPreset: () => Promise<void>
}) {
  const { i18n, t } = useTranslation()
  const { getEntityConfig } = useConfig()

  const presetsConfig = getEntityConfig({
    collectionSlug: 'payload-query-presets',
  })

  return (
    <Chip
      className={[baseClass, activePreset && `${baseClass}--active`].filter(Boolean).join(' ')}
      icon={activePreset?.isShared ? <PeopleIcon className={`${baseClass}__shared`} /> : undefined}
      id="select-preset"
      onClick={openPresetListDrawer}
      onRemove={activePreset ? () => void resetPreset() : undefined}
      size="medium"
    >
      <div className={`${baseClass}__label-text-max-width`}>
        <div className={`${baseClass}__label-text`}>
          {activePreset?.title ||
            t('general:selectLabel', {
              label: getTranslation(presetsConfig.labels.singular, i18n),
            })}
        </div>
      </div>
    </Chip>
  )
}
