'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAllFormFields, useForm } from 'payload/components/forms'
import { Field } from 'payload/dist/admin/components/forms/Form/types'

import { defaults } from '../defaults'

const {
  title: { minLength: minTitle, maxLength: maxTitle },
  description: { minLength: minDesc, maxLength: maxDesc },
} = defaults

export const Overview: React.FC = () => {
  const { dispatchFields, getFields } = useForm()

  const [
    {
      'meta.title': { value: metaTitle } = {} as Field,
      'meta.description': { value: metaDesc } = {} as Field,
      'meta.image': { value: metaImage } = {} as Field,
    },
  ] = useAllFormFields()

  const [titleIsValid, setTitleIsValid] = useState<boolean | undefined>()
  const [descIsValid, setDescIsValid] = useState<boolean | undefined>()
  const [imageIsValid, setImageIsValid] = useState<boolean | undefined>()

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
      <div>{`${numberOfPasses}/${testResults.length} checks are passing`}</div>
    </div>
  )
}
