import type { Field } from '../config/types.js'

export const baseAllLocaleStatusField: Field[] = [
  {
    name: '_localeStatus',
    type: 'json',
    admin: {
      components: {
        Cell: '@payloadcms/ui/rsc#AllLocaleStatusCell',
      },
      hidden: true,
    },
    hooks: {
      afterRead: [
        async (args) => {
          const { collection, data, req } = args
          const id = data?.id
          if (id && collection && collection.versions) {
            const version = await req.payload.findVersions({
              collection: collection.slug,
              depth: 0,
              limit: 1,
              select: {
                localeStatus: true,
              },
              where: {
                parent: {
                  equals: id,
                },
              },
            })

            if (version.docs && version.docs[0]?.localeStatus) {
              return version.docs[0].localeStatus
            }
          }
        },
      ],
    },
    label: 'Status - All Locales',
  },
]
