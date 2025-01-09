import type { PayloadRequest, SchedulePublishTaskInput } from 'payload'

export type SchedulePublishHandlerArgs = {
  date: Date
  req: PayloadRequest
} & SchedulePublishTaskInput

export const schedulePublishHandler = async ({
  type,
  date,
  doc,
  global,
  locale,
  req,
}: SchedulePublishHandlerArgs) => {
  const { i18n, payload, user } = req

  const incomingUserSlug = user?.collection

  const adminUserSlug = payload.config.admin.user

  if (!incomingUserSlug) {
    throw new Error('Unauthorized')
  }

  const adminAccessFunction = payload.collections[incomingUserSlug].config.access?.admin

  // Run the admin access function from the config if it exists
  if (adminAccessFunction) {
    const canAccessAdmin = await adminAccessFunction({ req })

    if (!canAccessAdmin) {
      throw new Error('Unauthorized')
    }
    // Match the user collection to the global admin config
  } else if (adminUserSlug !== incomingUserSlug) {
    throw new Error('Unauthorized')
  }

  try {
    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale,
        user: user.id,
      },
      task: 'schedulePublish',
      waitUntil: date,
    })
  } catch (err) {
    let error = `Error scheduling ${type} for `

    if (doc) {
      error += `document with ID ${doc.value} in collection ${doc.relationTo}`
    }

    payload.logger.error(error)
    payload.logger.error(err)

    return {
      error,
    }
  }

  return { message: i18n.t('general:success') }
}
