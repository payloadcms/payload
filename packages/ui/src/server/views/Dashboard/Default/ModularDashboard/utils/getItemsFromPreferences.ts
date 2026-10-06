import type { BasePayload, User } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'

import type { WidgetItem } from '../index.client.js'

import { getPreferences } from '../../../../../utilities/upsertPreferences.js'

export async function getItemsFromPreferences(
  payload: BasePayload,
  user: User,
): Promise<null | WidgetItem[]> {
  const savedPreferences = await getPreferences(
    PREFERENCE_KEYS.DASHBOARD_LAYOUT,
    payload,
    user.id,
    user.collection,
  )
  if (
    !savedPreferences?.value ||
    typeof savedPreferences.value !== 'object' ||
    !('layouts' in savedPreferences.value)
  ) {
    return null
  }
  return savedPreferences.value.layouts as null | WidgetItem[]
}
