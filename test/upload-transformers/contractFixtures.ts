import type {
  CanTransformArgs,
  HandleTransformRequestArgs,
  TransformFileArgs,
  TransformFileResult,
  UploadTransformer,
} from 'payload'

/**
 * What the contract test transformer does in one `transformFile` call. A test passes these as
 * `context.contractStages`, so each test controls the stage without a transformer per test.
 */
export type ContractStages = {
  first?: (
    args: TransformFileArgs,
  ) => Promise<TransformFileResult | void> | TransformFileResult | void
  /** The `_transforms` keys the transformer claims. Without them, `canTransform` returns `true`. */
  handledTransformKeys?: string[]
}

/** The arguments the contract transformer received, in the order the calls ran. */
export const contractCalls = {
  canTransform: [] as CanTransformArgs[],
  handleRequest: [] as ({ slug: string } & HandleTransformRequestArgs)[],
  /** `docAtStart` is a copy of `doc` before the stage ran. */
  transformFile: [] as ({ docAtStart: Record<string, unknown> } & TransformFileArgs)[],
}

/** `_transforms` as each `ContractMedia` hook saw it, so a test can prove hooks run after the pipeline. */
export const contractHookCalls: { _transforms: unknown; hook: string }[] = []

export function resetContractCalls(): void {
  contractCalls.canTransform.length = 0
  contractCalls.handleRequest.length = 0
  contractCalls.transformFile.length = 0
  contractHookCalls.length = 0
}

export const contractTransformers: UploadTransformer[] = [
  {
    slug: 'contract-first',
    canTransform: (args) => {
      contractCalls.canTransform.push(args)

      if (args.operation === 'request') {
        return args.req.searchParams?.has('contract')
          ? { canTransform: true, options: { purpose: args.purpose } }
          : false
      }

      const contractStages = args.req.context?.contractStages as ContractStages | undefined

      return contractStages
        ? {
            canTransform: true,
            handledTransformKeys: contractStages.handledTransformKeys,
            options: { stage: 'first' },
          }
        : false
    },
    handleRequest: async (args) => {
      contractCalls.handleRequest.push({ ...args, slug: 'contract-first' })

      // A stage that applies the saved transforms must build the file. This one passes its source on.
      return (args.options as { purpose?: string } | undefined)?.purpose === 'persisted-default'
        ? { response: await args.getSourceFile(), status: 'continue' }
        : { status: 'continue' }
    },
    mimeTypes: ['text/markdown', 'image/*'],
    transformFile: async (args) => {
      contractCalls.transformFile.push({ ...args, docAtStart: structuredClone(args.doc) })

      const stage = (args.req.context?.contractStages as ContractStages | undefined)?.first

      return (await stage?.(args)) ?? { status: 'continue' }
    },
  },
]
