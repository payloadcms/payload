import type { CollectionAfterPasswordResetHook } from 'payload'

const afterPasswordResetHookCalls: Parameters<CollectionAfterPasswordResetHook>[0][] = []

export const afterPasswordResetHook: CollectionAfterPasswordResetHook = (args) => {
  afterPasswordResetHookCalls.push(args)
}

export const clearAfterPasswordResetHookCalls = () => {
  afterPasswordResetHookCalls.length = 0
}

export const getAfterPasswordResetHookCalls = () => [...afterPasswordResetHookCalls]
