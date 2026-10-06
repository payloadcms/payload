import type { CollectionConfig, GlobalConfig, Payload, PayloadRequest } from 'payload'
import { buildConfig } from 'payload'
import { PayloadSDK as SDK } from '@payloadcms/sdk'

const Posts: CollectionConfig = { slug: 'posts', versions: { drafts: true }, fields: [] }
const Users: CollectionConfig = { slug: 'users', versions: false, fields: [] }
const Header: GlobalConfig = { slug: 'header', versions: { drafts: true }, fields: [] }
export default buildConfig({ collections: [Posts, Users], globals: [Header] })

async function migrate(payload: Payload, req: PayloadRequest) {
  const sdk = new SDK({ baseURL: 'http://localhost:3000', collections: {} })
  await payload.find({ collection: 'posts', draft: true })
  await req.payload.findByID({ collection: 'posts', id: '1', draft: false })
  await sdk.find({ collection: 'posts', draft: true })
  await payload.update({ collection: 'posts', id: '1', data: { title: 'Edit' }, draft: false })
  await payload.update({ collection: 'posts', id: '1', data: { title: 'Edit' } })
  await payload.updateGlobal({ slug: 'header', data: { title: 'Edit' }, draft: true })
  await payload.update({ collection: 'posts', id: '1', data: { _status: 'published' }, draft: true })
  await payload.create({ collection: 'posts', data: { title: 'Work' }, draft: true })
  await payload.create({ collection: 'posts', data: { _status: 'published', title: 'Live' }, draft: false })
  await payload.find({ collection: 'users', draft: true })
  await payload.update({ collection: 'users', id: '1', data: { email: 'x@y.com' }, draft: true })
}
