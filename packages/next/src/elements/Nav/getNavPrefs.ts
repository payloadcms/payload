import type { NavGroupType } from '@payloadcms/ui/shared'
import type { Payload, User } from 'payload'

export type ResolvedCollapsedPreferences = {
  [key: string]: boolean
}

export const getNavPrefs = async ({
  groups,
  payload,
  user,
}: {
  groups: NavGroupType[]
  payload: Payload
  user: User
}): Promise<ResolvedCollapsedPreferences> => {
  const preferences: { [key: string]: boolean } = {}

  await Promise.all(
    groups.map(async ({ label }) => {
      const result = await payload.find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        user,
        where: {
          and: [
            {
              key: {
                equals: `collapsed-${label}-groups`,
              },
            },
            {
              'user.relationTo': {
                equals: user.collection,
              },
            },
            {
              'user.value': {
                equals: user.id,
              },
            },
          ],
        },
      })

      preferences[label] = result.docs[0]?.value?.some((value: string) => value === label) ?? false
    }),
  )

  return preferences
}
