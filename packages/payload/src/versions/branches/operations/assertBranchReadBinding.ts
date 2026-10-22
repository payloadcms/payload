import { isDeepStrictEqual } from 'node:util'

import type { PayloadRequest } from '../../../types/index.js'

import { getBranchReadContext } from './branchReadContext.js'

export const assertBranchReadBinding = ({ req }: { req: PayloadRequest }): void => {
  const binding = getBranchReadContext({ req })?.binding
  if (
    binding &&
    (!isDeepStrictEqual(binding.user, req.user) ||
      binding.locale !== req.locale ||
      !isDeepStrictEqual(binding.fallbackLocale, req.fallbackLocale))
  ) {
    throw new Error('The branch read authorization or locale binding changed during the operation.')
  }
}
