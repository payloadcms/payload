import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { forkBranchReadRequest } from '../../../utilities/createBranchReadRequest.js'
import { inheritBranchReadContext } from './branchReadContext.js'

const selections = new WeakMap<object, BranchHeadID>()

/** Trusted internal selection; deliberately absent from public options and request.context. */
export const createSelectedBranchRequest = ({
  branchID,
  req,
}: {
  branchID: BranchHeadID
  req: PayloadRequest
}): PayloadRequest => {
  if (
    (typeof branchID !== 'string' || !branchID) &&
    (typeof branchID !== 'number' || !Number.isFinite(branchID))
  ) {
    throw new Error('A selected branch requires a typed identity.')
  }
  if (branchID === 'main') {
    throw new Error('A working selection cannot target main; use the publication intent.')
  }
  const view = createBranchOperationRequest({ req })
  selections.set(view, branchID)
  return view
}

/** Registered operation fork shared by distinct read and working-write intents. */
export const createBranchOperationRequest = ({ req }: { req: PayloadRequest }): PayloadRequest => {
  const rawFork = forkBranchReadRequest({ req })
  if (rawFork !== req) {
    return rawFork as PayloadRequest
  }
  const overrides = Object.assign(Object.create(Object.getPrototypeOf(req)), {
    context: { ...req.context },
    payloadDataLoader: undefined,
    query: { ...req.query },
    routeParams: { ...req.routeParams },
  }) as PayloadRequest
  const deleted = new Set<string | symbol>()
  const view = new Proxy(overrides, {
    defineProperty: (target, property, descriptor) => {
      deleted.delete(property)
      return Reflect.defineProperty(target, property, descriptor)
    },
    deleteProperty: (target, property) => {
      const isDeleted = Reflect.deleteProperty(target, property)
      if (isDeleted) {
        deleted.add(property)
      }
      return isDeleted
    },
    get: (target, property, receiver) => {
      if (deleted.has(property)) {
        return undefined
      }
      if (Object.hasOwn(target, property)) {
        return Reflect.get(target, property, receiver)
      }
      const value = Reflect.get(req, property, req)
      return typeof value === 'function' ? value.bind(req) : value
    },
    getOwnPropertyDescriptor: (target, property) =>
      deleted.has(property)
        ? undefined
        : Object.hasOwn(target, property)
          ? Reflect.getOwnPropertyDescriptor(target, property)
          : Object.hasOwn(req, property)
            ? {
                configurable: true,
                enumerable: true,
                value: Reflect.get(req, property, req),
                writable: true,
              }
            : undefined,
    has: (target, property) =>
      !deleted.has(property) && (Object.hasOwn(target, property) || property in req),
    ownKeys: (target) =>
      [...new Set([...Reflect.ownKeys(req), ...Reflect.ownKeys(target)])].filter(
        (property) => !deleted.has(property),
      ),
    set: (target, property, value) => {
      deleted.delete(property)
      return Reflect.set(target, property, value)
    },
  })
  inheritSelectedBranch({ source: req, target: view })
  inheritBranchReadContext({ source: req, target: view })
  return view
}

export const getSelectedBranch = ({
  req,
}: {
  req?: Partial<PayloadRequest>
}): BranchHeadID | undefined => (req ? selections.get(req) : undefined)

export const isNamedBranchSelected = ({ req }: { req?: Partial<PayloadRequest> }): boolean => {
  const branchID = getSelectedBranch({ req })
  return branchID !== undefined && branchID !== 'main' && branchID !== 'drafts'
}

export const forkSelectedBranchRequest = ({
  req,
}: {
  req: Partial<PayloadRequest>
}): Partial<PayloadRequest> => {
  const branchID = getSelectedBranch({ req })
  return branchID === undefined
    ? req
    : createSelectedBranchRequest({ branchID, req: req as PayloadRequest })
}

export const isWorkingBranchSelected = ({ req }: { req?: Partial<PayloadRequest> }): boolean =>
  getSelectedBranch({ req }) !== undefined

export const inheritSelectedBranch = ({
  source,
  target,
}: {
  source: Partial<PayloadRequest>
  target: PayloadRequest
}): void => {
  const branchID = selections.get(source)
  if (branchID !== undefined) {
    selections.set(target, branchID)
  }
}
