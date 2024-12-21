import type { UIFieldServerComponent } from 'payload'

export const ScheduledPublishField: UIFieldServerComponent = async ({ data, payload }) => {
  payload.find({ collection: 'payload-jobs' })
  return <div>{data.title}</div>
}
