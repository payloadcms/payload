'use client'

import type { FormField, UIField } from 'payload'

import { useAllFormFields, useForm, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import type { PluginSEOTranslationKeys, PluginSEOTranslations } from '../../translations/index.js'

import { defaults } from '../../defaults.js'

const {
  description: { maxLength: maxDescDefault, minLength: minDescDefault },
  title: { maxLength: maxTitleDefault, minLength: minTitleDefault },
} = defaults

type OverviewProps = {
  descriptionOverrides?: {
    maxLength?: number
    minLength?: number
  }
  descriptionPath?: string
  imagePath?: string
  titleOverrides?: {
    maxLength?: number
    minLength?: number
  }
  titlePath?: string
} & UIField

export const OverviewComponent: React.FC<OverviewProps> = ({
  descriptionOverrides,
  descriptionPath: descriptionPathFromContext,
  imagePath: imagePathFromContext,
  titleOverrides,
  titlePath: titlePathFromContext,
}) => {
  const { getFields } = useForm()

  const descriptionPath = descriptionPathFromContext || 'meta.description'
  const titlePath = titlePathFromContext || 'meta.title'
  const imagePath = imagePathFromContext || 'meta.image'

  const [
    {
      [descriptionPath]: { value: metaDesc } = {} as FormField,
      [imagePath]: { value: metaImage } = {} as FormField,
      [titlePath]: { value: metaTitle } = {} as FormField,
    },
  ] = useAllFormFields()
  const { t } = useTranslation<PluginSEOTranslations, PluginSEOTranslationKeys>()

  const [titleIsValid, setTitleIsValid] = useState<boolean | undefined>()
  const [descIsValid, setDescIsValid] = useState<boolean | undefined>()
  const [imageIsValid, setImageIsValid] = useState<boolean | undefined>()

  const minDesc = descriptionOverrides?.minLength || minDescDefault
  const maxDesc = descriptionOverrides?.maxLength || maxDescDefault
  const minTitle = titleOverrides?.minLength || minTitleDefault
  const maxTitle = titleOverrides?.maxLength || maxTitleDefault

  const resetAll = useCallback(() => {
    const fields = getFields()
    const fieldsWithoutMeta = fields
    fieldsWithoutMeta['meta.title'].value = ''
    fieldsWithoutMeta['meta.description'].value = ''
    fieldsWithoutMeta['meta.image'].value = ''
    // dispatchFields(fieldsWithoutMeta);
  }, [getFields])

  useEffect(() => {
    if (typeof metaTitle === 'string') {
      setTitleIsValid(metaTitle.length >= minTitle && metaTitle.length <= maxTitle)
    }
    if (typeof metaDesc === 'string') {
      setDescIsValid(metaDesc.length >= minDesc && metaDesc.length <= maxDesc)
    }
    setImageIsValid(Boolean(metaImage))
  }, [metaTitle, metaDesc, metaImage])

  const testResults = [titleIsValid, descIsValid, imageIsValid]

  const numberOfPasses = testResults.filter(Boolean).length

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div>
        {t('plugin-seo:checksPassing', { current: numberOfPasses, max: testResults.length })}
      </div>
    </div>
  )
}
