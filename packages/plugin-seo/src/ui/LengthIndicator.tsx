'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Pill } from './Pill'

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
  const { t } = useTranslation('plugin-seo')

  useEffect(() => {
    const textLength = text?.length || 0

    if (textLength === 0) {
      setLabel(t('missing'))
      setLabelStyle({
        backgroundColor: 'red',
        color: 'white',
      })
      setBarWidth(0)
    } else {
      const progress = (textLength - minLength) / (maxLength - minLength)

      if (progress < 0) {
        const ratioUntilMin = textLength / minLength

        if (ratioUntilMin > 0.9) {
          setLabel(t('almostThere'))
          setLabelStyle({
            backgroundColor: 'orange',
            color: 'white',
          })
        } else {
          setLabel(t('tooShort'))
          setLabelStyle({
            backgroundColor: 'orangered',
            color: 'white',
          })
        }

        setBarWidth(ratioUntilMin)
      }

      if (progress >= 0 && progress <= 1) {
        setLabel(t('good'))
        setLabelStyle({
          backgroundColor: 'green',
          color: 'white',
        })
        setBarWidth(progress)
      }

      if (progress > 1) {
        setLabel(t('tooLong'))
        setLabelStyle({
          backgroundColor: 'red',
          color: 'white',
        })
        setBarWidth(1)
      }
    }
  }, [minLength, maxLength, text])

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
          {t('characterCount', { current: text?.length || 0, maxLength, minLength })}
          {(textLength === 0 || charsUntilMin > 0) && (
            <Fragment>{t('charactersToGo', { characters: charsUntilMin })}</Fragment>
          )}
          {charsUntilMin <= 0 && charsUntilMax >= 0 && (
            <Fragment>{t('charactersLeftOver', { characters: charsUntilMax })}</Fragment>
          )}
          {charsUntilMax < 0 && (
            <Fragment>{t('charactersTooMany', { characters: charsUntilMax * -1 })}</Fragment>
          )}
        </small>
      </div>
      <div
        style={{
          backgroundColor: '#F3F3F3',
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
