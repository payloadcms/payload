import type { PlannedTransformer } from '../transformers/types.js'
import type { TransformState } from './types.js'

import { TransformerContractError } from '../../errors/TransformerContractError.js'

/** Require exactly one executor for each saved key before any source reads or effects. */
export function assertTransformCoverage({
  pipeline,
  state,
}: {
  pipeline: PlannedTransformer[]
  state: null | TransformState | undefined
}): void {
  const owners = new Map<string, string>()

  for (const { handledTransformKeys = [], transformer } of pipeline) {
    for (const key of handledTransformKeys) {
      if (!state || !Object.prototype.hasOwnProperty.call(state, key)) {
        throw new TransformerContractError(
          `Transformer ${transformer.slug} claims absent transform ${key}.`,
        )
      }
      if (owners.has(key)) {
        throw new TransformerContractError(`Transform ${key} has more than one executor.`)
      }

      owners.set(key, transformer.slug)
    }
  }

  for (const key of Object.keys(state ?? {})) {
    if (!owners.has(key)) {
      throw new TransformerContractError(
        `No configured transformer handles saved transform ${key}.`,
      )
    }
  }
}
