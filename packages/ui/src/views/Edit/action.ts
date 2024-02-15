'use server'

import { getPayload } from 'payload'
import { FormState } from '../../forms/Form/types'
import configPromise from 'payload-config'
import buildStateFromSchema from '../../forms/utilities/buildStateFromSchema'
import { reduceFieldsToValues } from '../..'
import { DocumentPreferences } from 'payload/types'
import { Locale } from 'payload/config'
import { User } from 'payload/auth'
import { initI18n } from '@payloadcms/translations'

export const getFormStateFromServer = async (
  args: {
    collectionSlug: string
    docPreferences: DocumentPreferences
    locale: Locale
    id?: string
    operation: 'create' | 'update'
    user: User
    language: string
  },
  {
    formState,
  }: {
    formState: FormState
  },
) => {
  const { collectionSlug, docPreferences, locale, id, operation, user, language } = args

  const payload = await getPayload({
    config: configPromise,
  })

  const collectionConfig = payload.collections[collectionSlug]?.config

  if (!collectionConfig) {
    throw new Error(`Collection with slug "${collectionSlug}" not found`)
  }

  const data = reduceFieldsToValues(formState, true)

  const { t } = await initI18n({
    translationsContext: 'client',
    language: language,
    config: payload.config.i18n,
  })

  const result = await buildStateFromSchema({
    id,
    data,
    fieldSchema: collectionConfig.fields,
    locale: locale.code,
    operation,
    preferences: docPreferences,
    t,
    user,
  })

  return result
}
