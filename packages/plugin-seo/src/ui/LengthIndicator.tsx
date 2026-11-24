'use client'

import { useTranslation } from '@payloadcms/ui'
import React, { Fragment } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../translations/index.js'

import '../fields/colors.css'
import { Pill } from './Pill.js'

export const LengthIndicator: React.FC<{
  maxLength?: number
  minLength?: number
  text?: string
}> = (props) => {
  const { maxLength = 0, minLength = 0, text } = props

  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const textLength = text?.length || 0

  let label: string
  let labelStyle: { backgroundColor: string; color: string }
  let barWidth: number

  if (textLength === 0) {
    label = t('plugin-seo:missing')
    labelStyle = {
      backgroundColor: 'var(--seo-danger-bg)',
      color: 'var(--seo-danger-text)',
    }
    barWidth = 0
  } else {
    const progress = (textLength - minLength) / (maxLength - minLength)

    if (progress < 0) {
      const ratioUntilMin = textLength / minLength

      if (ratioUntilMin > 0.9) {
        label = t('plugin-seo:almostThere')
        labelStyle = {
          backgroundColor: 'var(--seo-warning-bg)',
          color: 'var(--seo-warning-text)',
        }
      } else {
        label = t('plugin-seo:tooShort')
        labelStyle = {
          backgroundColor: 'var(--seo-short-bg)',
          color: 'var(--seo-danger-text)',
        }
      }

      barWidth = ratioUntilMin
    } else if (progress <= 1) {
      label = t('plugin-seo:good')
      labelStyle = {
        backgroundColor: 'var(--seo-success-bg)',
        color: 'var(--seo-success-text)',
      }
      barWidth = progress
    } else {
      label = t('plugin-seo:tooLong')
      labelStyle = {
        backgroundColor: 'var(--seo-danger-bg)',
        color: 'var(--seo-danger-text)',
      }
      barWidth = 1
    }
  }

  const charsUntilMax = maxLength - textLength
  const charsUntilMin = minLength - textLength

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        width: '100%',
      }}
    >
      <Pill backgroundColor={labelStyle.backgroundColor} color={labelStyle.color} label={label} />
      <div
        style={{
          flexShrink: 0,
          lineHeight: 1,
          marginRight: '10px',
          whiteSpace: 'nowrap',
        }}
      >
        <small>
          {t('plugin-seo:characterCount', { current: text?.length || 0, maxLength, minLength })}
          {(textLength === 0 || charsUntilMin > 0) && (
            <Fragment>{t('plugin-seo:charactersToGo', { characters: charsUntilMin })}</Fragment>
          )}
          {charsUntilMin <= 0 && charsUntilMax >= 0 && (
            <Fragment>{t('plugin-seo:charactersLeftOver', { characters: charsUntilMax })}</Fragment>
          )}
          {charsUntilMax < 0 && (
            <Fragment>
              {t('plugin-seo:charactersTooMany', { characters: charsUntilMax * -1 })}
            </Fragment>
          )}
        </small>
      </div>
      <div
        style={{
          backgroundColor: 'var(--seo-track-bg)',
          height: '2px',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: labelStyle.backgroundColor,
            height: '100%',
            left: 0,
            position: 'absolute',
            top: 0,
            width: `${barWidth * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
