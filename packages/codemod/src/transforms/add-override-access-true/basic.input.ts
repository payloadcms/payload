import { getPayload as loadPayload, type Payload as PayloadInstance } from 'payload'

declare const config: unknown
declare const options: Parameters<PayloadInstance['find']>[0]
declare const user: unknown

const cms = await loadPayload({ config })

await cms.count({ collection: 'posts' })
await cms.countVersions({ collection: 'posts' })
await cms.create({ collection: 'posts', data: { title: 'Post' }, user })
await cms.delete({ collection: 'posts', id: '1' })
await cms.duplicate({ collection: 'posts', id: '1' })
await cms.find(options)
await cms.findByID({ collection: 'posts', id: '1' })
await cms.findDistinct({ collection: 'posts', field: 'title' })
await cms.findVersionByID({ collection: 'posts', id: '1' })
await cms.findVersions({ collection: 'posts' })
await cms.restoreVersion({ collection: 'posts', id: '1' })
await cms.update({ ...options, collection: 'posts', data: { title: 'Updated' }, id: '1' })

await cms.countGlobalVersions({ global: 'settings' })
await cms.findGlobal({ slug: 'settings' })
await cms.findGlobalVersionByID({ slug: 'settings', id: '1' })
await cms.findGlobalVersions({ global: 'settings' })
await cms.restoreGlobalVersion({ slug: 'settings', id: '1' })
await cms.updateGlobal({ slug: 'settings', data: { title: 'Updated' } })

await cms.forgotPassword({ collection: 'users', data: { email: 'dev@example.com' } })
await cms.login({
  collection: 'users',
  data: { email: 'dev@example.com', password: 'password' },
})
await cms.unlock({ collection: 'users', data: { email: 'dev@example.com' } })

await cms.jobs.queue({ task: 'sync', input: {} })
await cms.jobs.run()
await cms.jobs.runByID({ id: '1' })
await cms.jobs.cancel({ where: { id: { equals: '1' } } })
await cms.jobs.cancelByID({ id: '1' })

export async function useKnownPayload(payload: PayloadInstance, req: { payload: PayloadInstance }) {
  const alias = req.payload

  await payload.find({ collection: 'posts', overrideAccess: false })
  await payload.find({ collection: 'posts', overrideAccess: true })
  await alias.findGlobal({ slug: 'settings' })
  await req.payload.create({ collection: 'posts', data: { title: 'From request' } })
}
