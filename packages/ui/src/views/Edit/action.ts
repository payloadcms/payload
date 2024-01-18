'use server'

import { getPayload } from 'payload'
import { FormState } from '../../forms/Form/types'
import configPromise from 'payload-config'
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema'
import { reduceFieldsToValues } from '../..'
import { DocumentPreferences } from 'payload/types'
import { Locale } from 'payload/config'
import { User } from 'payload/auth'
import { I18n } from '@payloadcms/translations'
import isDeepEqual from 'deep-equal'

let lastFormState: FormState | null = null

export const getFormStateFromServer = async (
  args: {
    collectionSlug: string
    docPreferences: DocumentPreferences
    locale: Locale
    id?: string
    operation: 'create' | 'update'
    user: User
    // TODO: the `t` function cannot be passed through to this action
    i18n: I18n
  },
  {
    formState,
  }: {
    formState: FormState
  },
) => {
  const { collectionSlug, docPreferences, locale, id, operation, user, i18n } = args

  const payload = await getPayload({
    config: configPromise,
  })

  const collectionConfig = payload.collections[collectionSlug].config

  const data = reduceFieldsToValues(formState, true)

  const result = await buildStateFromSchema({
    id,
    config: payload.config,
    data,
    fieldSchema: collectionConfig.fields,
    locale: locale.code,
    operation,
    preferences: docPreferences,
    // TODO: see note above
    t: i18n?.t || ((key: string) => key),
    user,
  })

  const hasChanged = !isDeepEqual(lastFormState, result)

  lastFormState = result

  if (hasChanged) return result

  return null
}
