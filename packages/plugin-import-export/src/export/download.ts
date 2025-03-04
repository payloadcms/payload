import type { PayloadHandler } from 'payload'

import type { CreateExportArgs } from './createExport.js'

import { createExport } from './createExport.js'

export const download: PayloadHandler = async (req) => {
  const input = req.data as CreateExportArgs['input']

  req.payload.logger.info('Download request received', { input })

  return createExport({
    download: true,
    input,
    req,
    user: req.user ?? undefined,
  })
}
