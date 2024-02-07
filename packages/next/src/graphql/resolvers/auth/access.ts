import { accessOperation } from 'payload/operations'
import type { SanitizedConfig } from 'payload/types'

import formatName from '../../utilities/formatName'
import isolateTransactionID from '../../utilities/isolateTransactionID'

const formatConfigNames = (results, configs) => {
  const formattedResults = { ...results }

  configs.forEach(({ slug }) => {
    const result = { ...(formattedResults[slug] || {}) }
    delete formattedResults[slug]
    formattedResults[formatName(slug)] = result
  })

  return formattedResults
}

function accessResolver(config: SanitizedConfig) {
  async function resolver(_, args, context) {
    const options = {
      req: isolateTransactionID(context.req),
    }

    const accessResults = await accessOperation(options)

    return {
      ...accessResults,
      ...formatConfigNames(accessResults.collections, context.req.payload.config.collections),
      ...formatConfigNames(accessResults.globals, context.req.payload.config.globals),
    }
  }

  return resolver
}

export default accessResolver
