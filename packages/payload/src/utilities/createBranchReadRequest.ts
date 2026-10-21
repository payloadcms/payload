import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

const reads = new Set([
  'auth',
  'count',
  'countGlobalVersions',
  'countVersions',
  'find',
  'findByID',
  'findDistinct',
  'findGlobal',
  'findGlobalVersionByID',
  'findGlobalVersions',
  'findVersionByID',
  'findVersions',
])

const metadata = new Set([
  'authStrategies',
  'blocks',
  'collections',
  'config',
  'db',
  'encryptionKeyring',
  'globals',
  'importMap',
  'logger',
  'secret',
  'types',
])
const utilities = new Set(['getAdminURL', 'getAPIURL'])
const reflection = new Set([
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
])

const payloadViews = new WeakSet<object>()

const requests = new WeakMap<
  object,
  { assertActive?: () => void; origin: Payload; payload: Payload }
>()

/**
 * Internal request view: native Request accessors retain their branded receiver,
 * while Local API normalization keeps the trusted operation-local Payload view.
 * No body clone/tee/read is needed and the caller's loader is never inherited.
 */
export const createBranchReadRequest = ({
  assertActive,
  locale,
  payload,
  req,
  transactionID,
}: {
  assertActive?: () => void
  locale?: string
  payload: Payload
  req: PayloadRequest
  transactionID?: number | Promise<number | string> | string
}): PayloadRequest => {
  assertActive ??= requests.get(req)?.assertActive
  const scopedPayload = new Proxy(Object.create(null) as Payload, {
    defineProperty: () => {
      throw Object.assign(new Error('A scoped Payload read view is immutable.'), {
        code: 'branch-read-snapshot-unsupported',
      })
    },
    get: (_opaque, property) => {
      assertActive?.()
      if (
        typeof property === 'symbol' ||
        ['__proto__', 'constructor', 'prototype', 'then', 'toJSON'].includes(property)
      ) {
        return undefined
      }
      if (property === 'valueOf') {
        return () => {
          assertActive?.()
          return scopedPayload
        }
      }
      if (reflection.has(property)) {
        return (...args: unknown[]) => {
          assertActive?.()
          return Reflect.apply(Reflect.get(Object.prototype, property), scopedPayload, args)
        }
      }
      if (!metadata.has(property) && !reads.has(property) && !utilities.has(property)) {
        throw unsupportedPayloadProperty()
      }
      const value = readPayloadDataProperty({ payload, property })
      if (metadata.has(property)) {
        return value
      }
      if (typeof value !== 'function') {
        throw unsupportedPayloadProperty()
      }
      return (...args: unknown[]) => {
        assertActive?.()
        if (reads.has(property)) {
          const options = (args[0] ?? {}) as { req?: PayloadRequest }
          if (
            options.req &&
            (!requests.has(options.req) || options.req.payload.db !== payload.db)
          ) {
            throw unsupportedPayloadProperty()
          }
          return Reflect.apply(value, payload, [
            { ...options, req: options.req ?? view },
            ...args.slice(1),
          ])
        }
        return Reflect.apply(value, payload, args)
      }
    },
    getOwnPropertyDescriptor: () => undefined,
    getPrototypeOf: () => null,
    ownKeys: () => [],
    preventExtensions: () => false,
    set: () => {
      throw Object.assign(new Error('A scoped Payload read view is immutable.'), {
        code: 'branch-read-snapshot-unsupported',
      })
    },
    setPrototypeOf: () => false,
  })
  const overrides = Object.assign(Object.create(Object.getPrototypeOf(req)), {
    context: { ...req.context },
    ...(locale === undefined ? {} : { locale }),
    payload: scopedPayload,
    payloadDataLoader: undefined,
    query: { ...req.query },
    routeParams: { ...req.routeParams },
    transactionID: transactionID ?? req.transactionID,
  }) as Record<PropertyKey, unknown>
  Object.defineProperty(overrides, 'transactionID', {
    configurable: false,
    enumerable: true,
    value: overrides.transactionID,
    writable: false,
  })
  const deleted = new Set<PropertyKey>()
  const view = new Proxy(overrides as unknown as PayloadRequest, {
    defineProperty: (_target, property, descriptor) => {
      if (property === 'transactionID') {
        throw unsupportedPayloadProperty()
      }
      deleted.delete(property)
      return Reflect.defineProperty(overrides, property, descriptor)
    },
    deleteProperty: (_target, property) => {
      if (property === 'transactionID') {
        throw unsupportedPayloadProperty()
      }
      const isDeleted = Reflect.deleteProperty(overrides, property)

      if (isDeleted) {
        deleted.add(property)
      }
      return isDeleted
    },
    get: (_target, property) => {
      assertActive?.()
      if (deleted.has(property)) {
        return undefined
      }
      if (Object.hasOwn(overrides, property)) {
        return overrides[property]
      }
      const value = Reflect.get(req, property, req)

      return typeof value === 'function' ? value.bind(req) : value
    },
    getOwnPropertyDescriptor: (_target, property) =>
      deleted.has(property)
        ? undefined
        : Object.hasOwn(overrides, property)
          ? Reflect.getOwnPropertyDescriptor(overrides, property)
          : Object.hasOwn(req, property)
            ? {
                configurable: true,
                enumerable: true,
                value: Reflect.get(req, property, req),
                writable: true,
              }
            : undefined,
    has: (_target, property) =>
      !deleted.has(property) && (Object.hasOwn(overrides, property) || property in req),
    ownKeys: () =>
      [...new Set([...Reflect.ownKeys(overrides), ...Reflect.ownKeys(req)])].filter(
        (property) => !deleted.has(property),
      ),
    set: (_target, property, value) => {
      if (property === 'transactionID') {
        if (!Object.is(value, overrides.transactionID)) {
          throw unsupportedPayloadProperty()
        }
        return true
      }
      deleted.delete(property)
      return Reflect.set(overrides, property, value)
    },
  })

  payloadViews.add(scopedPayload)
  requests.set(view, {
    assertActive,
    origin: requests.get(req)?.origin ?? req.payload,
    payload: scopedPayload,
  })
  return view
}

/** Native snapshot reads accept only registered request views with immutable bindings. */
export const isBranchReadRequest = ({ req }: { req: object }): boolean => requests.has(req)

export const assertNoBranchReadMutation = ({ req }: { req?: Partial<PayloadRequest> }): void => {
  if (req && (requests.has(req) || (req.payload && payloadViews.has(req.payload)))) {
    throw Object.assign(new Error('A raw branch read cannot invoke a mutation operation.'), {
      code: 'branch-read-snapshot-unsupported',
    })
  }
}

/** Only views allocated above can retain an alternative Payload during Local API entry. */
export const resolveBranchReadPayload = ({
  payload,
  req,
}: {
  payload: Payload
  req: Partial<PayloadRequest>
}): Payload => {
  const trusted = requests.get(req)

  if (!trusted) {
    if (req.payload && payloadViews.has(req.payload)) {
      throw Object.assign(
        new Error('A copied branch read request cannot detach its scoped Payload capability.'),
        { code: 'branch-read-snapshot-unsupported' },
      )
    }
    return payload
  }
  trusted.assertActive?.()
  if (
    payload !== trusted.payload &&
    payload !== trusted.origin &&
    !Object.prototype.isPrototypeOf.call(payload, trusted.origin)
  ) {
    throw Object.assign(
      new Error('A branch read request cannot be rebound to a different Payload instance.'),
      { code: 'branch-read-snapshot-unsupported' },
    )
  }
  return trusted.payload
}

/** Local API normalization must not mutate its caller's trusted locale, context or loader. */
export const forkBranchReadRequest = ({
  req,
}: {
  req: Partial<PayloadRequest>
}): Partial<PayloadRequest> => {
  const trusted = requests.get(req)

  if (!trusted) {
    return req
  }
  trusted.assertActive?.()
  return createBranchReadRequest({
    assertActive: trusted.assertActive,
    payload: trusted.payload,
    req: req as PayloadRequest,
  })
}

/** Admitted metadata must be data, not an arbitrary getter evaluated with the hidden receiver. */
const readPayloadDataProperty = ({
  payload,
  property,
}: {
  payload: Payload
  property: string
}): unknown => {
  let current: null | object = payload
  while (current) {
    if (payloadViews.has(current)) {
      return Reflect.get(current, property)
    }
    const descriptor = Object.getOwnPropertyDescriptor(current, property)
    if (descriptor) {
      if (!('value' in descriptor)) {
        throw unsupportedPayloadProperty()
      }
      return descriptor.value
    }
    current = Object.getPrototypeOf(current)
  }
  return undefined
}
const unsupportedPayloadProperty = (): Error =>
  Object.assign(
    new Error('This property is unavailable on a read-only scoped Payload capability.'),
    { code: 'branch-read-snapshot-unsupported' },
  )
