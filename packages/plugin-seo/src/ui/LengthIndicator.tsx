'use client'

import { useTranslation } from '@payloadcms/ui'
import React, { Fragment, useEffect, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../translations/index.js'

import '../fields/enhancedContrast.css'
import { Pill } from './Pill.js'

export const LengthIndicator: React.FC<{
  maxLength?: number
  minLength?: number
  text?: string
}> = (props) => {
  const { maxLength = 0, minLength = 0, text } = props

  const [labelStyle, setLabelStyle] = useState({
    backgroundColor: '',
    color: '',
  })

  const [label, setLabel] = useState('')
  const [barWidth, setBarWidth] = useState<number>(0)
  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  useEffect(() => {
    const textLength = text?.length || 0

    if (textLength === 0) {
      setLabel(t('plugin-seo:missing'))
      setLabelStyle({
        backgroundColor: 'var(--seo-danger-bg, red)',
        color: 'var(--seo-danger-text, white)',
      })
      setBarWidth(0)
    } else {
      const progress = (textLength - minLength) / (maxLength - minLength)

      if (progress < 0) {
        const ratioUntilMin = textLength / minLength

        if (ratioUntilMin > 0.9) {
          setLabel(t('plugin-seo:almostThere'))
          setLabelStyle({
            backgroundColor: 'var(--seo-warning-bg, orange)',
            color: 'var(--seo-warning-text, white)',
          })
        } else {
          setLabel(t('plugin-seo:tooShort'))
          setLabelStyle({
            backgroundColor: 'var(--seo-danger-bg, orangered)',
            color: 'var(--seo-danger-text, white)',
          })
        }

        setBarWidth(ratioUntilMin)
      }

      if (progress >= 0 && progress <= 1) {
        setLabel(t('plugin-seo:good'))
        setLabelStyle({
          backgroundColor: 'var(--seo-success-bg, green)',
          color: 'var(--seo-success-text, white)',
        })
        setBarWidth(progress)
      }

      if (progress > 1) {
        setLabel(t('plugin-seo:tooLong'))
        setLabelStyle({
          backgroundColor: 'var(--seo-danger-bg, red)',
          color: 'var(--seo-danger-text, white)',
        })
        setBarWidth(1)
      }
    }
  }, [minLength, maxLength, text, t])

  const textLength = text?.length || 0

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
          backgroundColor: 'var(--seo-track-bg, #F3F3F3)',
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
