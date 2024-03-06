import { accessOperation } from 'payload/operations'
import type { SanitizedConfig } from 'payload/types'

import formatName from '../../utilities/formatName.js'
import { Context } from '../types.js'
import { isolateObjectProperty } from 'payload/utilities'
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
  async function resolver(_, args, context: Context) {
    const options = {
      req: isolateObjectProperty<any>(context.req, 'transactionID'),
    }

    const accessResults = await accessOperation(options)

    return {
      ...accessResults,
      ...formatConfigNames(accessResults.collections, config.collections),
      ...formatConfigNames(accessResults.globals, config.globals),
    }
  }

  return resolver
}

export default accessResolver
