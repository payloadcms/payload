import type { SanitizedConfig } from 'payload'

import { writeFileSync } from 'fs'
import path from 'path'
import payload from 'payload'

export const script = async (config: SanitizedConfig) => {
  await payload.init({ config })
  const data = await payload.find({ collection: 'users' })
  writeFileSync(path.resolve(import.meta.dirname, '_data.json'), JSON.stringify(data), 'utf-8')
  process.exit(0)
}
