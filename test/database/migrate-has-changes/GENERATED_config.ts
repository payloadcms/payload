import { fileURLToPath } from 'node:url'
import path from 'path'
import { buildConfig } from 'payload'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const { databaseAdapter } = await import('../../databaseAdapter.js')
const adapterFactory = () => {
  const init = databaseAdapter.init
  databaseAdapter.init = ({ payload }) => {
    const res = init({ payload })
    res.migrationDir = path.resolve(dirname, 'migrations')
    res.push = false
    return res
  }
  return databaseAdapter
}
export default buildConfig({
  secret: '____',
  db: adapterFactory(),
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    },
    {
      slug: 'others',
      fields: [{ name: 'content', type: 'text' }],
    },
    {
      slug: 'comments',
      fields: [{ name: 'content', type: 'text' }],
    },
  ],
})
