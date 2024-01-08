import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'

import formatName from '../../../graphql/utilities/formatName'
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import access from '../../operations/access'

const formatConfigNames = (results, configs) => {
  const formattedResults = { ...results }

  configs.forEach(({ slug }) => {
    const result = { ...(formattedResults[slug] || {}) }
    delete formattedResults[slug]
    formattedResults[formatName(slug)] = result
  })

  return formattedResults
}

function accessResolver(payload: Payload) {
  async function resolver(_, args, context) {
    const options = {
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const accessResults = await access(options)

    return {
      ...accessResults,
      ...formatConfigNames(accessResults.collections, payload.config.collections),
      ...formatConfigNames(accessResults.globals, payload.config.globals),
    }
  }

  return resolver
}

export default accessResolver
