import { TransformerContractError } from '../../errors/TransformerContractError.js'

export type LazySourceGetter = {
  get: () => Promise<Response>
  wasCalled: () => boolean
}

/**
 * Wraps a source-retrieval function so it runs at most once. Constructing the
 * getter performs no work; the first `get()` call performs the retrieval, and
 * every later call rejects with a `TransformerContractError` — including while
 * the first call is still pending, or after it has rejected. This deliberately
 * does not memoize a reusable `Response`: the underlying body is normally a
 * single-use stream, so a failed first retrieval is never retried.
 */
export function createLazySourceGetter({
  retrieve,
}: {
  retrieve: () => Promise<Response>
}): LazySourceGetter {
  let called = false

  return {
    get: async () => {
      if (called) {
        throw new TransformerContractError(
          'A transformer stage attempted to call getSourceFile more than once.',
        )
      }

      called = true

      return retrieve()
    },
    wasCalled: () => called,
  }
}
