'use client'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { CustomTranslationsKeys, CustomTranslationsObject } from './config.js'

export const ComponentWithCustomI18n = () => {
  const { i18n, t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()

  const componentWithCustomI18nDefaultValidT = t('fields:addLink')
  // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
  const componentWithCustomI18nDefaultInvalidT = t('fields:addLink2')

  const componentWithCustomI18nDefaultValidI18nT = i18n.t('fields:addLink')
  // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
  const componentWithCustomI18nDefaultInvalidI18nT = i18n.t('fields:addLink2')

  const componentWithCustomI18nCustomValidT = t('general:test')
  const componentWithCustomI18nCustomValidI18nT = i18n.t('general:test')

  return (
    <div className="componentWithCustomI18n">
      <p>ComponentWithCustomI18n Default :</p>
      ComponentWithCustomI18n Default Valid t:{' '}
      <span className="componentWithCustomI18nDefaultValidT">
        {componentWithCustomI18nDefaultValidT}
      </span>
      <br />
      ComponentWithCustomI18n Default Valid i18n.t:{' '}
      <span className="componentWithCustomI18nDefaultValidI18nT">
        {componentWithCustomI18nDefaultValidI18nT}
      </span>
      <br />
      ComponentWithCustomI18n Default Invalid t:{' '}
      <span className="componentWithCustomI18nDefaultInvalidT">
        {componentWithCustomI18nDefaultInvalidT}
      </span>
      <br />
      ComponentWithCustomI18n Default Invalid i18n.t:
      <span className="componentWithCustomI18nDefaultInvalidI18nT">
        {' '}
        {componentWithCustomI18nDefaultInvalidI18nT}
      </span>
      <br />
      <br />
      <p>ComponentWithCustomI18n Custom:</p>
      <br />
      ComponentWithCustomI18n Custom Valid t:{' '}
      <span className="componentWithCustomI18nCustomValidT">
        {componentWithCustomI18nCustomValidT}
      </span>
      <br />
      ComponentWithCustomI18n Custom Valid i18n.t:{' '}
      <span className="componentWithCustomI18nCustomValidI18nT">
        {componentWithCustomI18nCustomValidI18nT}
      </span>
    </div>
  )
}
