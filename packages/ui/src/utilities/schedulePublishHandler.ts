import { canAccessAdmin, type SchedulePublishTaskInput, type ServerFunction } from 'payload'

export type SchedulePublishHandlerArgs = {
  date?: Date
  /**
   * The job id to delete to remove a scheduled publish event
   */
  deleteID?: number | string
  localeToPublish?: string
  timezone?: string
} & Pick<SchedulePublishTaskInput, 'doc' | 'global' | 'type'>

export const schedulePublishHandler: ServerFunction<SchedulePublishHandlerArgs> = async ({
  type,
  date,
  deleteID,
  doc,
  global,
  localeToPublish,
  req,
  timezone,
}) => {
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
        locale: localeToPublish,
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

    payload.logger.error({ err }, error)

    return {
      error,
    }
  }

  return { message: i18n.t('general:success') }
}
