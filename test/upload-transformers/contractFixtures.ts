import type {
  CanTransformArgs,
  HandleTransformRequestArgs,
  TransformFileArgs,
  TransformFileResult,
  UploadTransformer,
} from 'payload'

/**
 * What a contract test transformer does in one `transformFile` call. A test passes these as
 * `context.contractStages`, so each test controls the stages without a transformer per test.
 */
export type ContractStage = (
  args: TransformFileArgs,
) => Promise<TransformFileResult | void> | TransformFileResult | void

export type ContractStages = {
  first?: ContractStage
  second?: ContractStage
}

export type RecordedTransformFileCall = {
  docAtStart: Record<string, unknown>
  fileName: string
  isDocFrozen: boolean
  isOriginalDocFrozen: boolean
  originalDoc: Record<string, unknown>
  originalSourceText: string
  slug: string
  source: { filename: string; mimeType: string; sizeInBytes: number }
  sourceText: string
}

/** The arguments each contract transformer received, in the order the calls ran. */
export const contractCalls = {
  canTransform: [] as CanTransformArgs[],
  handleRequest: [] as HandleTransformRequestArgs[],
  transformFile: [] as RecordedTransformFileCall[],
}

/** `_transforms` as each `ContractMedia` hook saw it, so a test can prove hooks run after the pipeline. */
export const contractHookCalls: { _transforms: unknown; hook: string }[] = []

export function resetContractCalls(): void {
  contractCalls.canTransform.length = 0
  contractCalls.handleRequest.length = 0
  contractCalls.transformFile.length = 0
  contractHookCalls.length = 0
}

const readAllText = async (source: TransformFileArgs['source']): Promise<string> =>
  new TextDecoder().decode(
    await source.readFileBytes({ numberOfBytes: source.sizeInBytes, startByte: 0 }),
  )

const createContractTransformer = (stageName: keyof ContractStages): UploadTransformer => ({
  slug: `contract-${stageName}`,
  canTransform: (args) => {
    contractCalls.canTransform.push(args)

    if (args.operation === 'request') {
      return args.req.searchParams?.has('contract') ?? false
    }

    return Boolean(args.req.context?.contractStages)
  },
  handleRequest: (args) => {
    contractCalls.handleRequest.push(args)

    return Promise.resolve({ status: 'continue' })
  },
  mimeTypes: ['text/markdown', 'image/*'],
  transformFile: async (args) => {
    contractCalls.transformFile.push({
      docAtStart: structuredClone(args.doc),
      fileName: args.file.name,
      isDocFrozen: Object.isFrozen(args.doc),
      isOriginalDocFrozen: Object.isFrozen(args.originalDoc),
      originalDoc: args.originalDoc,
      originalSourceText: await readAllText(args.originalSource),
      slug: `contract-${stageName}`,
      source: {
        filename: args.source.filename,
        mimeType: args.source.mimeType,
        sizeInBytes: args.source.sizeInBytes,
      },
      sourceText: await readAllText(args.source),
    })

    const stage = (args.req.context?.contractStages as ContractStages | undefined)?.[stageName]

    return (await stage?.(args)) ?? { status: 'continue' }
  },
})

export const contractTransformers: UploadTransformer[] = [
  createContractTransformer('first'),
  createContractTransformer('second'),
]
