import { getPayload as loadPayload, type Payload as PayloadInstance } from 'payload'

declare const config: unknown
declare const options: Parameters<PayloadInstance['find']>[0]
declare const user: unknown

const cms = await loadPayload({ config })

await cms.count({ overrideAccess: true, collection: 'posts' })
await cms.countVersions({ overrideAccess: true, collection: 'posts' })
await cms.create({ overrideAccess: true, collection: 'posts', data: { title: 'Post' }, user })
await cms.delete({ overrideAccess: true, collection: 'posts', id: '1' })
await cms.duplicate({ overrideAccess: true, collection: 'posts', id: '1' })
await cms.find({ ...{ overrideAccess: true }, ...options })
await cms.findByID({ overrideAccess: true, collection: 'posts', id: '1' })
await cms.findDistinct({ overrideAccess: true, collection: 'posts', field: 'title' })
await cms.findVersionByID({ overrideAccess: true, collection: 'posts', id: '1' })
await cms.findVersions({ overrideAccess: true, collection: 'posts' })
await cms.restoreVersion({ overrideAccess: true, collection: 'posts', id: '1' })
await cms.update({ ...{ overrideAccess: true }, ...options, collection: 'posts', data: { title: 'Updated' }, id: '1' })

await cms.countGlobalVersions({ overrideAccess: true, global: 'settings' })
await cms.findGlobal({ overrideAccess: true, slug: 'settings' })
await cms.findGlobalVersionByID({ overrideAccess: true, slug: 'settings', id: '1' })
await cms.findGlobalVersions({ overrideAccess: true, global: 'settings' })
await cms.restoreGlobalVersion({ overrideAccess: true, slug: 'settings', id: '1' })
await cms.updateGlobal({ overrideAccess: true, slug: 'settings', data: { title: 'Updated' } })

await cms.forgotPassword({ overrideAccess: true, collection: 'users', data: { email: 'dev@example.com' } })
await cms.login({
  overrideAccess: true,
  collection: 'users',
  data: { email: 'dev@example.com', password: 'password' },
})
await cms.unlock({ overrideAccess: true, collection: 'users', data: { email: 'dev@example.com' } })

await cms.jobs.queue({ overrideAccess: true, task: 'sync', input: {} })
await cms.jobs.run({ overrideAccess: true })
await cms.jobs.runByID({ overrideAccess: true, id: '1' })
await cms.jobs.cancel({ overrideAccess: true, where: { id: { equals: '1' } } })
await cms.jobs.cancelByID({ overrideAccess: true, id: '1' })

export async function useKnownPayload(payload: PayloadInstance, req: { payload: PayloadInstance }) {
  const alias = req.payload

  await payload.find({ collection: 'posts', overrideAccess: false })
  await payload.find({ collection: 'posts', overrideAccess: true })
  await alias.findGlobal({ overrideAccess: true, slug: 'settings' })
  await req.payload.create({ overrideAccess: true, collection: 'posts', data: { title: 'From request' } })
}
