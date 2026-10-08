import { TransformerContractError } from '../../errors/TransformerContractError.js'

export type LazySourceGetter = {
  get: () => Promise<Response>
  wasCalled: () => boolean
}

/**
 * Wraps a source-retrieval function so it runs at most once: the first `get()`
 * call performs the retrieval, and every later call rejects with a
 * `TransformerContractError` — including while the first call is still pending,
 * or after it has rejected. Deliberately doesn't memoize a reusable `Response`,
 * since the underlying body is normally a single-use stream.
 */
export function createLazySourceGetter({
  retrieve,
}: {
  retrieve: () => Promise<Response>
}): LazySourceGetter {
  let wasCalled = false

  return {
    get: async () => {
      if (wasCalled) {
        throw new TransformerContractError(
          'A transformer stage attempted to call getSourceFile more than once.',
        )
      }

      wasCalled = true

      return retrieve()
    },
    wasCalled: () => wasCalled,
  }
}
