'use client'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

export const ComponentWithDefaultI18n = () => {
  const { i18n, t } = useTranslation()

  const componentWithDefaultI18nValidT = t('fields:addLink')
  // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
  const componentWithDefaultI18nInvalidT = t('fields:addLink2')

  const componentWithDefaultI18nValidI18nT = i18n.t('fields:addLink')
  // @ts-expect-error // Keep the ts-expect-error comment. This NEEDS to throw an error
  const componentWithDefaultI18nInvalidI18nT = i18n.t('fields:addLink2')

  return (
    <div className="componentWithDefaultI18n">
      <p>ComponentWithDefaultI18n </p>
      ComponentWithDefaultI18n Valid t:{' '}
      <span className="componentWithDefaultI18nValidT">{componentWithDefaultI18nValidT}</span>
      <br />
      ComponentWithDefaultI18n Valid i18n.t:{' '}
      <span className="componentWithDefaultI18nValidI18nT">
        {componentWithDefaultI18nValidI18nT}
      </span>
      <br />
      ComponentWithDefaultI18n Invalid t:{' '}
      <span className="componentWithDefaultI18nInvalidT">{componentWithDefaultI18nInvalidT}</span>
      <br />
      ComponentWithDefaultI18n Invalid i18n.t:{' '}
      <span className="componentWithDefaultI18nInvalidI18nT">
        {componentWithDefaultI18nInvalidI18nT}
      </span>
    </div>
  )
}
