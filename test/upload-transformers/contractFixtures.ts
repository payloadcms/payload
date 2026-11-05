import type {
  CanTransformArgs,
  TransformFileArgs,
  TransformFileResult,
  UploadTransformer,
} from 'payload'

/**
 * What the contract test transformer does in one `transformFile` call. A test passes these as
 * `context.contractStages`, so each test controls the stage without a transformer per test.
 */
export type ContractStages = {
  /**
   * The `_transforms` keys each contract transformer claims. Without an entry, `contract-first`
   * returns `true` and `contract-second` does not take part.
   */
  claims?: { first?: string[]; second?: string[] }
  first?: (
    args: TransformFileArgs,
  ) => Promise<TransformFileResult | void> | TransformFileResult | void
}

/** The arguments the contract transformer received, in the order the calls ran. */
export const contractCalls = {
  canTransform: [] as CanTransformArgs[],
  /** `docAtStart` is a copy of `doc` before the stage ran. */
  transformFile: [] as ({ docAtStart: Record<string, unknown> } & TransformFileArgs)[],
}

/** `_transforms` as each `ContractMedia` hook saw it, so a test can prove hooks run after the pipeline. */
export const contractHookCalls: { _transforms: unknown; hook: string }[] = []

export function resetContractCalls(): void {
  contractCalls.canTransform.length = 0
  contractCalls.transformFile.length = 0
  contractHookCalls.length = 0
}

export const contractTransformers: UploadTransformer[] = [
  {
    slug: 'contract-first',
    canTransform: (args) => {
      contractCalls.canTransform.push(args)

      const contractStages = args.req.context?.contractStages as ContractStages | undefined
      const handledTransformKeys = contractStages?.claims?.first

      if (!contractStages) {
        return false
      }

      return handledTransformKeys ? { canTransform: true, handledTransformKeys } : true
    },
    mimeTypes: ['text/markdown', 'image/*'],
    transformFile: async (args) => {
      contractCalls.transformFile.push({ ...args, docAtStart: structuredClone(args.doc) })

      const stage = (args.req.context?.contractStages as ContractStages | undefined)?.first

      return (await stage?.(args)) ?? { status: 'continue' }
    },
  },
  {
    slug: 'contract-second',
    canTransform: ({ req }) => {
      const handledTransformKeys = (req.context?.contractStages as ContractStages | undefined)
        ?.claims?.second

      return handledTransformKeys ? { canTransform: true, handledTransformKeys } : false
    },
    mimeTypes: ['text/markdown'],
    transformFile: () => Promise.resolve({ status: 'continue' }),
  },
]
