import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from './resolveUploadDocument.js'
import type { PlannedTransformer, UploadDocument, UploadTransformer } from './types.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { assertTransformCoverage } from '../transformState/assertTransformCoverage.js'
import { canReuseStoredDefault } from '../transformState/canReuseStoredDefault.js'
import { createDocumentSnapshot } from './createDocumentSnapshot.js'
import { createLazySourceGetter } from './createLazySourceGetter.js'
import { finalizeFileResponse } from './finalizeFileResponse.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { matchesMimeType } from './matchesMimeType.js'
import { getCandidateTransformers, planTransformerPipeline } from './planTransformerPipeline.js'
import { getRequestedFile, resolveUploadDocument } from './resolveUploadDocument.js'
import { withFileTransformAccessContext } from './withFileTransformAccessContext.js'

/**
 * Orchestrates a dynamic file request end to end: resolve the document, plan the
 * request-capable transformer pipeline from the requested file's authoritative
 * MIME type (the primary file or the matched image size), enforce
 * transform-aware read access, then run every eligible transformer in declaration
 * order against a lazily-fetched source. Called from `getFileHandler` only when at
 * least one transformer is configured — the zero-transformer path never reaches
 * this function.
 */
export async function handleDynamicFileRequest({
  collection,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<Response> {
  const resolvedDocument = await resolveUploadDocument({ collection, filename, prefix, req })

  if (!resolvedDocument) {
    // There's no mimeType to plan a pipeline from, so both access modes must pass
    // before admitting the file doesn't exist — otherwise the status code would leak
    // file existence to an access function keyed on req.fileTransform.
    for (const isTransform of [true, false]) {
      await withFileTransformAccessContext({
        callback: () => checkFileAccess({ collection, filename, prefix, req }),
        isTransform,
        req,
      })
    }
    throw new NotFound(req.t)
  }

  if (resolvedDocument.original?.filename === filename && resolvedDocument.filename !== filename) {
    const permittedDocument = await withFileTransformAccessContext({
      callback: () => checkFileAccess({ collection, filename, prefix, req }),
      isTransform: false,
      req,
    })

    return retrieveFileResponse({
      collection,
      doc: (permittedDocument ?? resolvedDocument) as ResolvedUploadDocument,
      filename,
      prefix,
      req,
    })
  }

  const { doc, document, hasPersistedWork, originalDoc, pipeline } = await authorizeDocument({
    collection,
    filename,
    prefix,
    req,
    resolvedDocument,
  })

  const planPipeline = ({
    mimeType,
    purpose,
    transformers,
  }: {
    mimeType: string
    purpose: 'persisted-default' | 'request-override'
    transformers?: UploadTransformer[]
  }) => planRequestPipeline({ collection, doc, mimeType, originalDoc, purpose, req, transformers })
  const persistedPipeline = hasPersistedWork
    ? await planPipeline({
        mimeType: doc.original?.mimeType ?? doc.mimeType,
        purpose: 'persisted-default',
      })
    : []

  if (hasPersistedWork) {
    assertTransformCoverage({ pipeline: persistedPipeline, state: doc._transforms })
  }

  const createOriginalSource = () =>
    createLazySourceGetter({
      retrieve: () =>
        getSourceFileResponse({
          collection,
          document,
          filename: document.original?.filename ?? document.filename,
          prefix,
          req,
        }),
    })
  const source = hasPersistedWork
    ? createOriginalSource()
    : createLazySourceGetter({
        retrieve: () => getSourceFileResponse({ collection, document, filename, prefix, req }),
      })
  const phases = [
    { pipeline: persistedPipeline, purpose: 'persisted-default' as const },
    { pipeline, purpose: 'request-override' as const },
  ]

  let currentResponse: Response | undefined
  // Aborted on failure to close every response body handed to a transformer, even one the
  // transformer locked with its own reader before throwing.
  const handedOutBodyControllers = new Map<Response, AbortController>()
  const discardResponse = async ({
    response,
    retainedResponse,
  }: {
    response: Response
    retainedResponse: Response
  }): Promise<void> => {
    // Locked bodies can still feed a returned streaming response; release them when it ends.
    if (response.body && (response.body.locked || response.body === retainedResponse.body)) {
      return
    }
    await cancelUnusedBody(response)
    handedOutBodyControllers.get(response)?.abort()
    handedOutBodyControllers.delete(response)
  }
  let cancelFinalResponse: (() => void) | undefined
  const cleanup = () => {
    cancelFinalResponse?.()
    for (const controller of handedOutBodyControllers.values()) {
      controller.abort()
    }
    handedOutBodyControllers.clear()
    req.signal?.removeEventListener('abort', cleanup)
  }
  req.signal?.addEventListener('abort', cleanup, { once: true })
  const finalize = ({ response }: { response: Response }) => {
    if (!response.body) {
      cleanup()
      return finalizeFileResponse({ collection, req, response })
    }
    const reader = response.body.getReader()
    const body = new ReadableStream<Uint8Array>({
      async cancel(reason) {
        cancelFinalResponse = undefined
        cleanup()
        await reader.cancel(reason).catch(() => {})
      },
      async pull(controller) {
        try {
          const result = await reader.read()
          if (result.done) {
            controller.close()
            cancelFinalResponse = undefined
            cleanup()
          } else {
            controller.enqueue(result.value)
          }
        } catch (err) {
          controller.error(err)
          cancelFinalResponse = undefined
          cleanup()
        }
      },
      start(controller) {
        cancelFinalResponse = () => {
          controller.error(req.signal?.reason)
          void reader.cancel(req.signal?.reason).catch(() => {})
          cancelFinalResponse = undefined
        }
        if (req.signal?.aborted) {
          cleanup()
        }
      },
    })
    return finalizeFileResponse({
      collection,
      req,
      response: new Response(body, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      }),
    })
  }
  let currentMimeType = hasPersistedWork
    ? (doc.original?.mimeType ?? doc.mimeType)
    : getRequestedFile({ document, filename }).mimeType

  const initialOverrideMimeType = getRequestedFile({ document, filename }).mimeType

  try {
    for (const phase of phases) {
      if (phase.purpose === 'request-override' && currentMimeType !== initialOverrideMimeType) {
        phase.pipeline = await planPipeline({ mimeType: currentMimeType, purpose: phase.purpose })
      }
      const phaseMimeType = currentMimeType
      const stages =
        phase.purpose === 'persisted-default'
          ? phase.pipeline.map((planned) => ({ planned, transformer: planned.transformer }))
          : (req.payload.config.upload.transformers.length
              ? req.payload.config.upload.transformers
              : phase.pipeline.map(({ transformer }) => transformer)
            ).map((transformer) => ({
              planned: phase.pipeline.find((stage) => stage.transformer === transformer),
              transformer,
            }))

      for (const [index, { planned, transformer }] of stages.entries()) {
        if (!transformer.handleRequest) {
          continue
        }
        const stage =
          planned ??
          (currentMimeType !== phaseMimeType
            ? (
                await planPipeline({
                  mimeType: currentMimeType,
                  purpose: phase.purpose,
                  transformers: [transformer],
                })
              )[0]
            : undefined)
        if (!stage) {
          continue
        }
        const { handledTransformKeys, options } = stage

        const isMatchingMimeType = transformer.mimeTypes.some((pattern) =>
          matchesMimeType({ mimeType: currentMimeType, pattern }),
        )
        if (handledTransformKeys?.length && !isMatchingMimeType) {
          throw new TransformerContractError(
            `Transformer ${transformer.slug} cannot handle the current source MIME type ${currentMimeType}.`,
          )
        }
        if (!isMatchingMimeType) {
          continue
        }
        const previousResponse = currentResponse
        let handedOutResponse: Response | undefined
        const handedOutBodyController = new AbortController()
        const stageSource = createLazySourceGetter({
          retrieve: async () => {
            handedOutResponse = withAbortableBody({
              response: currentResponse ?? (await source.get()),
              signal: req.signal
                ? AbortSignal.any([req.signal, handedOutBodyController.signal])
                : handedOutBodyController.signal,
            })
            handedOutBodyControllers.set(handedOutResponse, handedOutBodyController)
            return handedOutResponse
          },
        })

        const originalBodyController = new AbortController()
        const stageOriginal = createLazySourceGetter({
          retrieve: async () => {
            const response = withAbortableBody({
              response: await createOriginalSource().get(),
              signal: req.signal
                ? AbortSignal.any([req.signal, originalBodyController.signal])
                : originalBodyController.signal,
            })
            handedOutBodyControllers.set(response, originalBodyController)
            return response
          },
        })
        const result = await transformer.handleRequest({
          collectionSlug: collection.config.slug,
          doc,
          getOriginalFile: stageOriginal.get,
          getSourceFile: stageSource.get,
          options,
          originalDoc,
          purpose: phase.purpose,
          req,
        })

        if (result.response) {
          if (handedOutResponse && result.response !== handedOutResponse) {
            await discardResponse({
              response: handedOutResponse,
              retainedResponse: result.response,
            })
          } else if (previousResponse && result.response !== previousResponse) {
            await discardResponse({ response: previousResponse, retainedResponse: result.response })
          }
          currentResponse = result.response
          const mimeType = result.response.headers.get('content-type')?.split(';')[0]?.trim()

          if (
            !mimeType &&
            handledTransformKeys?.length &&
            !(
              result.status === 'complete' &&
              result.response.status >= 300 &&
              result.response.status < 400
            )
          ) {
            throw new TransformerContractError(
              'A persisted transformer must return the representation Content-Type.',
            )
          }
          if (mimeType) {
            doc.mimeType = mimeType
            currentMimeType = mimeType
          }
        } else if (stageSource.wasCalled()) {
          throw new TransformerContractError(
            'A transformer that consumes its source must return a response.',
          )
        }

        if (result.status === 'complete') {
          const pendingOverrides =
            phase.purpose === 'persisted-default'
              ? await planPipeline({ mimeType: currentMimeType, purpose: 'request-override' })
              : []
          if (
            phase.purpose === 'persisted-default' &&
            (stages.slice(index + 1).some(({ planned }) => planned?.handledTransformKeys?.length) ||
              pendingOverrides.length > 0)
          ) {
            throw new TransformerContractError(
              'A persisted transform completed before all saved transforms and request overrides were satisfied.',
            )
          }
          return finalize({ response: currentResponse! })
        }
      }
    }
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Error running the file transformer pipeline' })
    for (const handedOutBodyController of handedOutBodyControllers.values()) {
      handedOutBodyController.abort(err)
    }
    cleanup()
    await cancelUnusedBody(currentResponse)
    throw err
  }

  if (currentResponse) {
    return finalize({ response: currentResponse })
  }

  cleanup()

  // No transformer produced a response — serve the original file through the
  // normal path (Range/ETag/redirect support, existing `modifyResponseHeaders` order).
  return retrieveFileResponse({ collection, doc: document, filename, prefix, req })
}

/**
 * Re-wraps `response` so its body can be cancelled through `signal`, closing the underlying
 * source stream (file handle, storage connection) regardless of who holds a reader on it.
 */
function withAbortableBody({
  response,
  signal,
}: {
  response: Response
  signal: AbortSignal
}): Response {
  if (!response.body) {
    return response
  }

  let removeAbortListener: () => void
  const reader = response.body.getReader()
  const body = new ReadableStream<Uint8Array>({
    async cancel(reason) {
      removeAbortListener()
      await reader.cancel(reason)
    },
    async pull(controller) {
      try {
        const result = await reader.read()
        if (signal.aborted) {
          return
        }
        if (result.done) {
          removeAbortListener()
          controller.close()
        } else {
          controller.enqueue(result.value)
        }
      } catch (err) {
        removeAbortListener()
        if (!signal.aborted) {
          controller.error(err)
        }
      }
    },
    start(controller) {
      const abort = () => {
        signal.removeEventListener('abort', abort)
        controller.error(signal.reason)
        void reader.cancel(signal.reason).catch(() => {})
      }
      signal.addEventListener('abort', abort, { once: true })
      if (signal.aborted) {
        abort()
      }
      removeAbortListener = () => signal.removeEventListener('abort', abort)
    },
  })
  return new Response(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}

/**
 * Cancels a response body nothing has started reading. A locked body was handed to a transformer
 * through `withAbortableBody`, and is closed by aborting its signal instead.
 */
async function cancelUnusedBody(response: Response | undefined): Promise<void> {
  if (!response?.body || response.body.locked) {
    return
  }

  try {
    await response.body.cancel()
  } catch {
    // A clean-up failure must not replace the pipeline result or error.
  }
}

function planRequestPipeline({
  collection,
  doc,
  mimeType,
  originalDoc,
  purpose = 'request-override',
  req,
  transformers = req.payload.config.upload.transformers,
}: {
  collection: Collection
  doc: UploadDocument
  mimeType: string
  originalDoc: Readonly<UploadDocument>
  purpose?: 'persisted-default' | 'request-override'
  req: PayloadRequest
  transformers?: UploadTransformer[]
}): Promise<PlannedTransformer[]> {
  return planTransformerPipeline({
    args: {
      collectionSlug: collection.config.slug,
      doc,
      operation: 'request',
      originalDoc,
      purpose,
      req,
    },
    capability: 'handleRequest',
    mimeType,
    transformers,
  })
}

function hasPersistedTransformWork({
  collection,
  doc,
  filename,
  req,
}: {
  collection: Collection
  doc: UploadDocument
  filename: string
  req: PayloadRequest
}): boolean {
  return Boolean(
    doc._transforms &&
      Object.keys(doc._transforms).length &&
      !canReuseStoredDefault({ collection: collection.config, doc, filename, req }),
  )
}

type AccessResult = { document?: ResolvedUploadDocument; isAllowed: true } | { isAllowed: false }

/**
 * Decides which document is served and which pipeline runs, checking read access
 * before any application-defined transformer code (`canTransform`) executes.
 *
 * 1. The first access mode comes from MIME matching alone: a transform-aware check
 *    when any transformer could handle the file, otherwise an ordinary read.
 * 2. If the transform-aware check is denied, an ordinary read may still be allowed
 *    (e.g. public originals, signed-in-only variants), so that mode is tried next.
 * 3. Only once a check has passed does `canTransform` plan the real pipeline.
 * 4. The access mode the final pipeline requires must itself have passed — a
 *    "variants only" policy must not leak the original when no transformer applies.
 *
 * `resolveUploadDocument` is unfiltered, so without a `prefix` it can match a
 * document the user can't read that shares the filename (filenames are only
 * unique per prefix). Whenever `checkFileAccess` returns a document, that
 * authorized document is the one served — storage adapters trust `doc` to
 * resolve the object key.
 */
async function authorizeDocument({
  collection,
  filename,
  prefix,
  req,
  resolvedDocument,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
  resolvedDocument: ResolvedUploadDocument
}): Promise<{
  doc: UploadDocument
  document: ResolvedUploadDocument
  hasPersistedWork: boolean
  originalDoc: Readonly<UploadDocument>
  pipeline: PlannedTransformer[]
}> {
  const accessResults = new Map<boolean, Promise<AccessResult>>()

  const checkAccess = ({ isTransform }: { isTransform: boolean }): Promise<AccessResult> => {
    if (!accessResults.has(isTransform)) {
      accessResults.set(
        isTransform,
        withFileTransformAccessContext({
          callback: () => checkFileAccess({ collection, filename, prefix, req }),
          isTransform,
          req,
        }).then(
          (document) => ({
            document: document as ResolvedUploadDocument | undefined,
            isAllowed: true as const,
          }),
          (err: unknown) => {
            if (err instanceof Forbidden) {
              return { isAllowed: false as const }
            }

            throw err
          },
        ),
      )
    }

    return accessResults.get(isTransform)!
  }

  const hasSavedTransformWork = hasPersistedTransformWork({
    collection,
    doc: resolvedDocument,
    filename,
    req,
  })
  const hasCandidateTransformers =
    hasSavedTransformWork ||
    getCandidateTransformers({
      capability: 'handleRequest',
      mimeType: getRequestedFile({ document: resolvedDocument, filename }).mimeType,
      transformers: req.payload.config.upload.transformers,
    }).length > 0

  let isTransformAccess = hasCandidateTransformers
  let access = await checkAccess({ isTransform: isTransformAccess })

  if (!access.isAllowed && isTransformAccess) {
    isTransformAccess = false
    access = await checkAccess({ isTransform: isTransformAccess })
  }

  if (!access.isAllowed) {
    throw new Forbidden(req.t)
  }

  const document =
    access.document && access.document.id !== resolvedDocument.id
      ? access.document
      : resolvedDocument

  const doc = structuredClone(document)
  const originalDoc = createDocumentSnapshot({ doc })
  const pipeline = await planRequestPipeline({
    collection,
    doc,
    mimeType: getRequestedFile({ document, filename }).mimeType,
    originalDoc,
    req,
  })
  const isTransform =
    pipeline.length > 0 || hasPersistedTransformWork({ collection, doc: document, filename, req })

  if (isTransform !== isTransformAccess) {
    const requiredAccess = await checkAccess({ isTransform })

    if (
      !requiredAccess.isAllowed ||
      (requiredAccess.document && requiredAccess.document.id !== document.id)
    ) {
      throw new Forbidden(req.t)
    }
  }

  return {
    doc,
    document,
    hasPersistedWork: hasPersistedTransformWork({ collection, doc, filename, req }),
    originalDoc,
    pipeline,
  }
}
