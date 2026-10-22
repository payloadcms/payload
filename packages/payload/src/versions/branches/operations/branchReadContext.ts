import { isDeepStrictEqual } from 'node:util'

import type { Payload } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

import { createBranchOperationRequest, getSelectedBranch } from './selectedBranchContext.js'

export type BranchReadContext = {
  binding: {
    fallbackLocale: PayloadRequest['fallbackLocale']
    locale: PayloadRequest['locale']
    user: PayloadRequest['user']
  }
  branchID: BranchHeadID
  isEffective: boolean
  materializedCollections: string[]
  materializedVisibility: Record<string, string>
  sources: Payload['collections']
}
const contexts = new WeakMap<object, BranchReadContext>()
const intents = new WeakMap<object, BranchHeadID>()

/** Read-only selection is independent of working-write intent, including main. */
export const createBranchReadIntent = ({
  branchID,
  req,
}: {
  branchID: BranchHeadID
  req: PayloadRequest
}): PayloadRequest => {
  if (
    !(
      (typeof branchID === 'string' && branchID.length > 0) ||
      (typeof branchID === 'number' && Number.isFinite(branchID))
    )
  ) {
    throw new Error('A branch read requires a typed identity.')
  }
  const view = createBranchOperationRequest({ req })
  intents.set(view, branchID)
  return view
}
export const getBranchReadIntent = ({
  req,
}: {
  req: Partial<PayloadRequest>
}): BranchHeadID | undefined => intents.get(req)
export const getBranchReadContext = ({
  req,
}: {
  req: Partial<PayloadRequest>
}): BranchReadContext | undefined => contexts.get(req)
export const registerBranchReadContext = ({
  context,
  req,
}: {
  context: BranchReadContext
  req: PayloadRequest
}): void => {
  contexts.set(req, context)
}
export const inheritBranchReadContext = ({
  source,
  target,
}: {
  source: Partial<PayloadRequest>
  target: PayloadRequest
}): void => {
  const context = contexts.get(source)
  const intent = intents.get(source)
  if (context) {
    contexts.set(target, context)
  }
  if (intent !== undefined) {
    intents.set(target, intent)
  }
}

/** beforeOperation may derive a registered view, but cannot silently discard selection. */
export const assertBranchReadOperationRequest = ({
  source,
  sourceCollection,
  target,
  targetCollection,
}: {
  source?: PayloadRequest
  sourceCollection: string
  target?: PayloadRequest
  targetCollection: string
}): void => {
  if (!source) {
    return
  }
  const selection = getBranchReadIntent({ req: source }) ?? getSelectedBranch({ req: source })
  const context = getBranchReadContext({ req: source })
  if (selection === undefined && !context) {
    return
  }
  if (
    !target ||
    sourceCollection !== targetCollection ||
    (selection !== undefined &&
      (getBranchReadIntent({ req: target }) ?? getSelectedBranch({ req: target })) !== selection) ||
    (context && getBranchReadContext({ req: target }) !== context)
  ) {
    throw new Error(
      'A branch read operation cannot detach its registered request or entity binding.',
    )
  }
}

export const assertBranchReadBinding = ({ req }: { req: PayloadRequest }): void => {
  const binding = contexts.get(req)?.binding
  if (
    binding &&
    (!isDeepStrictEqual(binding.user, req.user) ||
      binding.locale !== req.locale ||
      !isDeepStrictEqual(binding.fallbackLocale, req.fallbackLocale))
  ) {
    throw new Error('The branch read authorization or locale binding changed during the operation.')
  }
}
