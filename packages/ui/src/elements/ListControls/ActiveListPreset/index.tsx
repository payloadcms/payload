'use client'
import type { ListPreset } from 'payload'

import { Fragment } from 'react'

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
    <Fragment>
      <div className={baseClass}>
        <Pill
          className={`${baseClass}__select`}
          onClick={() => {
            openPresetListDrawer()
          }}
          pillStyle="dark"
        >
          <div className={`${baseClass}__select__label-text`}>
            {activePreset?.title || 'Select preset'}
          </div>
          {activePreset ? (
            <div
              className={`${baseClass}__select__clear`}
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
      </div>
    </Fragment>
  )
}
