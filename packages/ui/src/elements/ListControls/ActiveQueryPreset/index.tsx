'use client'
import type { QueryPreset } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { PeopleIcon } from '../../../icons/People/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Pill } from '../../Pill/index.js'
import './index.scss'

const baseClass = 'active-query-preset'

export function ActiveQueryPreset({
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
    <Pill
      className={[baseClass, activePreset && `${baseClass}--active`].filter(Boolean).join(' ')}
      id="select-preset"
      onClick={() => {
        openPresetListDrawer()
      }}
      pillStyle={activePreset ? 'always-white' : 'light'}
    >
      {activePreset?.isShared && <PeopleIcon className={`${baseClass}__shared`} />}
      <div className={`${baseClass}__label-text`}>
        {activePreset?.title ||
          t('general:selectLabel', { label: getTranslation(presetsConfig.labels.singular, i18n) })}
      </div>
      {activePreset ? (
        <div
          className={`${baseClass}__clear`}
          id="clear-preset"
          onClick={async (e) => {
            e.stopPropagation()
            await resetPreset()
          }}
          onKeyDown={async (e) => {
            e.stopPropagation()
            await resetPreset()
          }}
          role="button"
          tabIndex={0}
        >
          <XIcon />
        </div>
      ) : null}
    </Pill>
  )
}
