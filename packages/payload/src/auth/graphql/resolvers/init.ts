import init from '../../operations/init'

function initResolver(collection: string) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: { ...context.req } as PayloadRequest,
    }

    return init(options)
  }

  return resolver
}

export default initResolver
