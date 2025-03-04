'use client'
import type { ListPreset } from 'payload'

import { PeopleIcon } from '../../../icons/People/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { Pill } from '../../Pill/index.js'
import './index.scss'

const baseClass = 'active-list-preset'

export function ActiveListPreset({
  activePreset,
  openPresetListDrawer,
  resetPreset,
}: {
  activePreset: ListPreset
  openPresetListDrawer: () => void
  resetPreset: () => Promise<void>
}) {
  console.log('activePreset', activePreset)
  return (
    <Pill
      className={[baseClass, activePreset && `${baseClass}--active`].filter(Boolean).join(' ')}
      id="select-preset"
      onClick={() => {
        openPresetListDrawer()
      }}
      pillStyle={activePreset ? 'always-white' : 'light'}
    >
      {activePreset?.isShared && <PeopleIcon />}
      <div className={`${baseClass}__label-text`}>{activePreset?.title || 'Select preset'}</div>
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
