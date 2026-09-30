import type { Payload } from 'payload'

const localAPIMethods = new Set([
  'count',
  'countVersions',
  'create',
  'delete',
  'find',
  'findByID',
  'findDistinct',
  'findGlobal',
  'findGlobalVersions',
  'findVersions',
  'update',
  'updateGlobal',
])

const branchingLocalAPIMethods = new Set(['discard', 'merge'])

/** Keeps this legacy suite's trusted setup explicit after Local API access became secure by default. */
export const createTrustedPayload = (payload: Payload): Payload =>
  new Proxy(payload, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)

      if (property === 'branches' && typeof value === 'object' && value) {
        return new Proxy(value, {
          get(branchesTarget, branchesProperty, branchesReceiver) {
            const branchesValue = Reflect.get(branchesTarget, branchesProperty, branchesReceiver)

            if (
              typeof branchesProperty !== 'string' ||
              !branchingLocalAPIMethods.has(branchesProperty) ||
              typeof branchesValue !== 'function'
            ) {
              return branchesValue
            }

            return (options: Record<string, unknown>) =>
              Reflect.apply(branchesValue, branchesTarget, [
                {
                  ...options,
                  overrideAccess: options.overrideAccess ?? true,
                },
              ])
          },
        })
      }

      if (
        typeof property !== 'string' ||
        !localAPIMethods.has(property) ||
        typeof value !== 'function'
      ) {
        return value
      }

      return (options: Record<string, unknown>) =>
        Reflect.apply(value, target, [
          {
            ...options,
            overrideAccess: options.overrideAccess ?? true,
          },
        ])
    },
  })
