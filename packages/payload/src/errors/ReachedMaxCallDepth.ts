import { APIError } from './APIError.js'

export class ReachedMaxCallDepth extends APIError {
  constructor(maxCallDepth: number) {
    super(
      `Max call depth (${maxCallDepth}) for Local API operations is reached. This can be caused by hooks that lead to infinity loops. Verify if there are any and use the 'context' property to avoid this error.`,
    )
  }
}
