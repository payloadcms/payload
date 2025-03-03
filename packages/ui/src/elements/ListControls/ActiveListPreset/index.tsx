'use client'
import type { ListPreset } from 'payload'

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
  return (
    <Pill
      className={baseClass}
      onClick={() => {
        openPresetListDrawer()
      }}
    >
      <div className={`${baseClass}__label-text`}>{activePreset?.title || 'Select preset'}</div>
      {activePreset ? (
        <div
          className={`${baseClass}__clear`}
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
