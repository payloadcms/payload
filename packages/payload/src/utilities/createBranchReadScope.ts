import { isBranchReadRequest } from './createBranchReadRequest.js'

export const isBranchReadMutation = ({ method }: { method: string }): boolean =>
  mutation.test(method)

const mutation =
  /^(?:batchProcessing|run|queue|cancel|handleSchedules|schedule|renameFile|duplicate|restoreVersion|restoreGlobalVersion|login|logout|forgotPassword|resetPassword|unlock|verifyEmail|beginTransaction|commitTransaction|rollbackTransaction|connect|copy|create|delete|destroy|generateSchema|init|migrate|mutate|update|upsert)/
const reads = new Set([
  'count',
  'countGlobalVersions',
  'countVersions',
  'find',
  'findDistinct',
  'findGlobal',
  'findGlobalVersions',
  'findOne',
  'findVersions',
  'queryDrafts',
])
const metadata = new Set([
  'allowAdditionalKeys',
  'allowIDOnCreate',
  'bulkOperationsSingleTransaction',
  'defaultIDType',
  'idType',
  'name',
  'packageName',
])

/** Private native adapter, opaque expiring read capability; no raw driver handles escape. */
export const createBranchReadScope = <T extends object>({
  adapter: nativeAdapter,
  assertReadActive,
  shouldSerializeReads = false,
}: {
  adapter: T
  assertReadActive?: () => void
  shouldSerializeReads?: boolean
}): {
  adapter: T
  assertActive: () => void
  nativeAdapter: T
  revoke: () => void
  setRequest: (args: { req: { payload: { db: object }; transactionID?: unknown } }) => void
} => {
  let queue: Promise<unknown> = Promise.resolve()
  let isActive = true
  let expectedTransactionID: Promise<unknown> | undefined
  let request: { payload: { db: object }; transactionID?: unknown } | undefined
  const assertActive = (): void => {
    if (!isActive) {
      throw unsupported()
    }
    assertReadActive?.()
  }
  const assertRequest = async ({ req }: { req: typeof request }) => {
    assertActive()
    const transactionID = await expectedTransactionID

    if (
      transactionID == null ||
      !request ||
      !req ||
      !isBranchReadRequest({ req }) ||
      req.payload.db !== adapter ||
      (await req.transactionID) !== transactionID
    ) {
      throw unsupported()
    }
    assertActive()
  }

  const invokeRead = async ({
    args,
    method,
    target,
  }: {
    args: unknown[]
    method: (...args: unknown[]) => unknown
    target: object
  }) => {
    assertActive()
    const options = (args[0] ?? {}) as {
      req?: { payload: { db: object }; transactionID?: unknown }
    }
    const req = options.req ?? request
    await assertRequest({ req })
    const execute = async () => {
      // A caller transaction can expire, or a queued request can change, while
      // another read is in flight. Admission alone does not protect execution.
      await assertRequest({ req })
      return Reflect.apply(method, target, [{ ...options, req }, ...args.slice(1)])
    }
    if (!shouldSerializeReads) {
      return execute()
    }
    const result = queue.then(execute)
    queue = result.catch(() => undefined)
    return result
  }
  const wrapBranching = (target: object, isQuery = false): object =>
    new Proxy(Object.create(null), {
      defineProperty: () => {
        throw unsupported()
      },
      deleteProperty: () => {
        throw unsupported()
      },
      get: (_opaque, property) => {
        assertActive()
        if (
          !isQuery &&
          !['capabilities', 'queryProjection', 'withReadSnapshot'].includes(String(property))
        ) {
          throw unsupported()
        }
        if (isQuery && !['count', 'find', 'findDistinct'].includes(String(property))) {
          throw unsupported()
        }
        const value = Reflect.get(target, property, target)
        if (typeof value === 'function') {
          return (...args: unknown[]) => {
            assertActive()
            if (typeof property === 'string' && mutation.test(property)) {
              throw unsupported()
            }
            if (property === 'withReadSnapshot') {
              const options = (args[0] ?? {}) as { req?: typeof request }
              const req = options.req ?? request

              // Nested callbacks can issue native reads themselves. Validate their
              // request without queueing the entire callback behind those reads.
              return assertRequest({ req }).then(() =>
                Reflect.apply(value, target, [{ ...options, req }, ...args.slice(1)]),
              )
            }
            return reads.has(String(property))
              ? invokeRead({ args, method: value as (...args: unknown[]) => unknown, target })
              : Reflect.apply(value, target, args)
          }
        }
        if (property === 'queryProjection' && value && typeof value === 'object') {
          return wrapBranching(value, true)
        }
        return value
      },
      getOwnPropertyDescriptor: () => undefined,
      getPrototypeOf: () => null,
      ownKeys: () => [],
      preventExtensions: () => {
        throw unsupported()
      },
      set: () => {
        throw unsupported()
      },
      setPrototypeOf: () => {
        throw unsupported()
      },
    })
  const adapter = new Proxy(Object.create(null) as T, {
    defineProperty: () => {
      throw unsupported()
    },
    deleteProperty: () => {
      throw unsupported()
    },
    get: (_opaque, property) => {
      const target = nativeAdapter
      assertActive()
      if (property === 'then') {
        return undefined
      }
      if (typeof property !== 'string') {
        throw unsupported()
      }
      if (property !== 'branching' && !metadata.has(property) && !reads.has(property)) {
        throw unsupported()
      }
      const value = Reflect.get(target, property, target)
      if (property === 'branching' && value) {
        return wrapBranching(value)
      }
      if (metadata.has(property)) {
        return value
      }
      if (!reads.has(property) || typeof value !== 'function') {
        throw unsupported()
      }
      return (...args: unknown[]) =>
        invokeRead({ args, method: value as (...args: unknown[]) => unknown, target })
    },
    getOwnPropertyDescriptor: () => undefined,
    getPrototypeOf: () => null,
    ownKeys: () => [],
    preventExtensions: () => {
      throw unsupported()
    },
    set: () => {
      throw unsupported()
    },
    setPrototypeOf: () => {
      throw unsupported()
    },
  })

  return {
    adapter,
    assertActive,
    nativeAdapter,
    revoke: () => {
      isActive = false
    },
    setRequest: ({ req }) => {
      assertActive()
      if (request || !isBranchReadRequest({ req })) {
        throw unsupported()
      }
      expectedTransactionID = Promise.resolve(req.transactionID)
      request = req
    },
  }
}

const unsupported = (): Error =>
  Object.assign(
    new Error(
      'The branch read capability is read only and valid only during its snapshot callback.',
    ),
    { code: 'branch-read-snapshot-unsupported' },
  )
