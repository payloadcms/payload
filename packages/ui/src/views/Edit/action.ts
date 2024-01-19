'use server'

import { getPayload } from 'payload'
import { FormState } from '../../forms/Form/types'
import configPromise from 'payload-config'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { reduceFieldsToValues } from '../..'
import { DocumentPreferences } from 'payload/types'
import { Locale } from 'payload/config'
import { User } from 'payload/auth'
import { initTFunction } from '@payloadcms/translations'
import isDeepEqual from 'deep-equal'
import { translations } from '@payloadcms/translations/api'

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

  const collectionConfig = payload.collections[collectionSlug].config

  const data = reduceFieldsToValues(formState, true)

  // TODO: memoize the creation of this function based on language
  const t = initTFunction({ config: payload.config.i18n, language, translations })

  const result = await buildStateFromSchema({
    id,
    config: payload.config,
    data,
    fieldSchema: collectionConfig.fields,
    locale: locale.code,
    operation,
    preferences: docPreferences,
    t,
    user,
  })

  return !isDeepEqual(formState, result) ? result : null
}
