import { canAccessAdmin, type PayloadRequest, type SchedulePublishTaskInput } from 'payload'

export type SchedulePublishHandlerArgs = {
  date?: Date
  /**
   * The job id to delete to remove a scheduled publish event
   */
  deleteID?: number | string
  req: PayloadRequest
  timezone?: string
} & SchedulePublishTaskInput

export const schedulePublishHandler = async ({
  type,
  date,
  deleteID,
  doc,
  global,
  locale,
  req,
  timezone,
}: SchedulePublishHandlerArgs) => {
  const { i18n, payload, user } = req

  await canAccessAdmin({ req })

  try {
    if (deleteID) {
      await payload.delete({
        collection: 'payload-jobs',
        req,
        where: { id: { equals: deleteID } },
      })
    }

    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale,
        timezone,
        user: user.id,
      },
      task: 'schedulePublish',
      waitUntil: date,
    })
  } catch (err) {
    let error

    if (deleteID) {
      error = `Error deleting scheduled publish event with ID ${deleteID}`
    } else {
      error = `Error scheduling ${type} for `
      if (doc) {
        error += `document with ID ${doc.value} in collection ${doc.relationTo}`
      }
    }

    payload.logger.error(error)
    payload.logger.error(err)

    return {
      error,
    }
  }

  return { message: i18n.t('general:success') }
}
