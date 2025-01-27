'use client'

import type { FormField } from 'payload/types'

import { useAllFormFields, useForm } from 'payload/components/forms'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { defaults } from '../defaults'

const {
  description: { maxLength: maxDesc, minLength: minDesc },
  title: { maxLength: maxTitle, minLength: minTitle },
} = defaults

export const Overview: React.FC = () => {
  const {
    //  dispatchFields,
    getFields,
  } = useForm()

  const [
    {
      'meta.description': { value: metaDesc } = {} as FormField,
      'meta.image': { value: metaImage } = {} as FormField,
      'meta.title': { value: metaTitle } = {} as FormField,
    },
  ] = useAllFormFields()
  const { t } = useTranslation('plugin-seo')

  const [titleIsValid, setTitleIsValid] = useState<boolean | undefined>()
  const [descIsValid, setDescIsValid] = useState<boolean | undefined>()
  const [imageIsValid, setImageIsValid] = useState<boolean | undefined>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetAll = useCallback(() => {
    const fields = getFields()
    const fieldsWithoutMeta = fields
    fieldsWithoutMeta['meta.title'].value = ''
    fieldsWithoutMeta['meta.description'].value = ''
    fieldsWithoutMeta['meta.image'].value = ''
    // dispatchFields(fieldsWithoutMeta);
  }, [getFields])

  useEffect(() => {
    if (typeof metaTitle === 'string')
      setTitleIsValid(metaTitle.length >= minTitle && metaTitle.length <= maxTitle)
    if (typeof metaDesc === 'string')
      setDescIsValid(metaDesc.length >= minDesc && metaDesc.length <= maxDesc)
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
      <div>{t('checksPassing', { current: numberOfPasses, max: testResults.length })}</div>
    </div>
  )
}
