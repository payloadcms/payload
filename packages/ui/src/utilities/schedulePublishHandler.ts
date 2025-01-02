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
  req: { i18n, payload },
}: SchedulePublishHandlerArgs) => {
  try {
    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale,
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
