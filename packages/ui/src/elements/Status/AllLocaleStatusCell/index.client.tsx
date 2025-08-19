'use client'

import type { Data } from 'payload'

import React from 'react'

import { Pill } from '../../Pill/index.js'
import './index.scss'

type Props = {
  readonly availableLocales: string[]
  readonly data: Data
}

const baseClass = 'locale-status-cell'

export const AllLocaleStatusCellClient = ({ availableLocales, data }: Props) => {
  const localesToRender = Object.fromEntries(
    Object.entries(data).filter(([key]) => availableLocales.includes(key))
  )

  if (Object.keys(localesToRender).length === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      {Object.entries(localesToRender).map(([locale, status]) => (
        <Pill key={locale} pillStyle={status === 'published' ? 'success' : 'light-gray'} size="small">
          {locale}
        </Pill>
      ))}
    </div>
  )
}
