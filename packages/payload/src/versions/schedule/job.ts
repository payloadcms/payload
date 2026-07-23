import type { Field } from '../../fields/config/types.js'
import type { User } from '../../index.js'
import type { TaskConfig } from '../../queues/config/types/taskTypes.js'
import type { SchedulePublishTaskInput } from './types.js'

import { ValidationError } from '../../errors/index.js'
import { JobCancelledError } from '../../queues/errors/index.js'
import { resolvePublishLocales } from '../../utilities/resolvePublishLocales.js'

type Args = {
  adminUserSlug: string
  collections: string[]
  globals: string[]
}

function throwScheduledPublishValidationError(
  errors: {
    locale?: string
    message: string
    path: string
  }[],
): never {
  const details = errors
    .map(
      ({ locale, message, path }) =>
        `[${locale ?? 'default'}] ${path}${message ? `: ${message}` : ''}`,
    )
    .join('; ')

  throw new JobCancelledError(`Scheduled publish validation failed: ${details}`)
}

export const getSchedulePublishTask = ({
  adminUserSlug,
  collections,
  globals,
}: Args): TaskConfig<{ input: SchedulePublishTaskInput; output: object }> => {
  return {
    slug: 'schedulePublish',
    handler: async ({ input, req }) => {
      const _status = input?.type === 'publish' || !input?.type ? 'published' : 'draft'

      const userID = input.user

      let user: null | User = null

      if (userID) {
        user = (await req.payload.findByID({
          id: userID,
          collection: adminUserSlug,
          depth: 0,
        })) as User

        user.collection = adminUserSlug
      }

      const isPublishAllLocales = input.locale === undefined
      const publishLocales = resolvePublishLocales({
        locale: input.locale,
        localization: req.payload.config.localization,
        publishAllLocales: isPublishAllLocales,
      })

      if (input.doc) {
        // input.doc.value is always a string (#10481); coerce back to the real ID type.
        const idType =
          req.payload.collections[input.doc.relationTo]?.customIDType ??
          req.payload.db?.defaultIDType ??
          'text'
        const id = idType === 'number' ? Number(input.doc.value) : input.doc.value

        if (_status === 'published') {
          const validationResult = await req.payload.validate({
            id,
            collection: input.doc.relationTo,
            draft: true,
            locale: publishLocales,
            overrideAccess: user === null,
            req,
            user,
          })

          if (!validationResult.valid) {
            throwScheduledPublishValidationError(validationResult.errors)
          }
        }

        try {
          await req.payload.update({
            id,
            collection: input.doc.relationTo,
            data: {
              _status,
            },
            depth: 0,
            locale: input.locale,
            overrideAccess: user === null,
            publishAllLocales: _status === 'published' && isPublishAllLocales,
            req,
            user,
          })
        } catch (error) {
          if (error instanceof ValidationError) {
            throwScheduledPublishValidationError(error.data.errors)
          }

          throw error
        }
      }

      if (input.global) {
        if (_status === 'published') {
          const validationResult = await req.payload.validateGlobal({
            slug: input.global,
            draft: true,
            locale: publishLocales,
            overrideAccess: user === null,
            req,
            user,
          })

          if (!validationResult.valid) {
            throwScheduledPublishValidationError(validationResult.errors)
          }
        }

        try {
          await req.payload.updateGlobal({
            slug: input.global,
            data: {
              _status,
            },
            depth: 0,
            locale: input.locale,
            overrideAccess: user === null,
            publishAllLocales: _status === 'published' && isPublishAllLocales,
            req,
            user,
          })
        } catch (error) {
          if (error instanceof ValidationError) {
            throwScheduledPublishValidationError(error.data.errors)
          }

          throw error
        }
      }

      return {
        output: {},
      }
    },
    inputSchema: [
      {
        name: 'type',
        type: 'radio',
        defaultValue: 'publish',
        options: ['publish', 'unpublish'],
      },
      {
        name: 'locale',
        type: 'text',
      },
      ...(collections.length > 0
        ? [
            {
              name: 'doc',
              type: 'relationship',
              relationTo: collections,
            } satisfies Field,
          ]
        : []),
      {
        name: 'global',
        type: 'select',
        options: globals,
      },
      {
        name: 'user',
        type: 'relationship',
        relationTo: adminUserSlug,
      },
    ],
  }
}
