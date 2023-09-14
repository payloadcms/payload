import init from '../../operations/init'

function initResolver(collection: string) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: context.req,
    }

    return init(options)
  }

  return resolver
}

export default initResolver
