import type {
  CanTransformArgs,
  HandleTransformRequestArgs,
  TransformFileArgs,
  TransformFileResult,
  TransformValidate,
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
  /** The `_transforms` keys the transformer claims in the saved-state phase of a request. */
  requestClaims?: string[]
}

/** The arguments the contract transformer received, in the order the calls ran. */
export const contractCalls = {
  canTransform: [] as CanTransformArgs[],
  handleRequest: [] as ({ slug: string } & HandleTransformRequestArgs)[],
  /** `docAtStart` is a copy of `doc` before the stage ran. */
  transformFile: [] as ({ docAtStart: Record<string, unknown> } & TransformFileArgs)[],
  /** Each call of the `watermark` definition's `validate`. */
  validate: [] as { context: Parameters<TransformValidate>[1]; value: unknown }[],
}

/** `_transforms` as each `ContractMedia` hook saw it, so a test can prove hooks run after the pipeline. */
export const contractHookCalls: { _transforms: unknown; hook: string }[] = []

export function resetContractCalls(): void {
  contractCalls.canTransform.length = 0
  contractCalls.handleRequest.length = 0
  contractCalls.transformFile.length = 0
  contractCalls.validate.length = 0
  contractHookCalls.length = 0
}

export const contractTransformers: UploadTransformer[] = [
  {
    slug: 'contract-first',
    canTransform: (args) => {
      contractCalls.canTransform.push(args)

      if (args.operation === 'request') {
        const requestClaims = (args.req.context?.contractStages as ContractStages | undefined)
          ?.requestClaims

        if (requestClaims && args.purpose === 'persisted-default') {
          return { canTransform: true, handledTransformKeys: requestClaims, options: {} }
        }

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
    transformDefinitions: [
      {
        key: 'watermark',
        schema: {
          type: 'object',
          additionalProperties: false,
          description: 'Text drawn over the file.',
          properties: {
            opacity: { type: 'number', maximum: 1, minimum: 0 },
            text: { type: 'string', minLength: 1 },
          },
          required: ['text'],
        },
        validate: (value, context) => {
          contractCalls.validate.push({ context, value })

          return (value as { text: string }).text === 'forbidden'
            ? 'watermark: this text is not allowed'
            : true
        },
      },
    ],
    transformFile: async (args) => {
      contractCalls.transformFile.push({ ...args, docAtStart: structuredClone(args.doc) })

      const stage = (args.req.context?.contractStages as ContractStages | undefined)?.first

      return (await stage?.(args)) ?? { status: 'continue' }
    },
  },
]
