import type { FormState, Payload, PayloadRequest } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const SEED_TITLE = 'seed'

export type EditScript = Array<
  | { index: number; kind: 'removeRow'; path: string }
  | { kind: 'addRow'; path: string }
  | { kind: 'select'; path: string; value: unknown }
  | { kind: 'type'; path: string; perCharDelay: number; value: string }
>

export type CallCounter = {
  buildFormStateCalls: number
  /** Populated in Phase 5 once the renderFields server function exists. */
  renderFieldsCalls: number
  /** Total wall-clock time spent inside server function calls during the run. */
  totalServerCallTimeMs: number
}

export async function runScriptedEdit(opts: {
  collection: string
  script: EditScript
}): Promise<CallCounter> {
  const counter: CallCounter = {
    buildFormStateCalls: 0,
    renderFieldsCalls: 0,
    totalServerCallTimeMs: 0,
  }

  const { payload, restClient } = await initPayloadInt(dirname, undefined, true)

  let doc: { id: number | string; title: string } | undefined
  try {
    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())
    const user = data.user

    const req = await createLocalReq({ user }, payload)

    doc = (await payload.create({
      collection: opts.collection,
      data: { title: SEED_TITLE },
    })) as { id: number | string; title: string }

    let formState: FormState = {}
    for (const action of opts.script) {
      if (action.kind === 'type') {
        let acc = ''
        for (const ch of action.value) {
          acc += ch
          formState = { ...formState, [action.path]: { value: acc } }
          await invoke({
            collection: opts.collection,
            counter,
            data: doc,
            formState,
            id: doc.id,
            payload,
            req,
          })
          await new Promise((r) => setTimeout(r, action.perCharDelay))
        }
      } else if (action.kind === 'select') {
        formState = { ...formState, [action.path]: { value: action.value } }
        await invoke({
          collection: opts.collection,
          counter,
          data: doc,
          formState,
          id: doc.id,
          payload,
          req,
        })
      }
      // addRow / removeRow not exercised by Phase 0 baseline; left as future-proof shape.
    }
  } finally {
    if (doc?.id !== undefined) {
      try {
        await payload.delete({ collection: opts.collection, id: doc.id })
      } catch {
        // Swallow delete failures so we don't mask the original error from the script loop.
      }
    }
    await payload.destroy()
  }

  return counter
}

async function invoke(args: {
  collection: string
  counter: CallCounter
  data: Record<string, unknown>
  formState: FormState
  id: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  const { collection, counter, data, formState, id, req } = args
  const t0 = performance.now()
  await buildFormState({
    id,
    collectionSlug: collection,
    data,
    docPermissions: {
      create: true,
      delete: true,
      fields: true,
      read: true,
      readVersions: true,
      update: true,
    },
    docPreferences: { fields: {} },
    documentFormState: undefined,
    formState,
    mockRSCs: true,
    operation: 'update',
    renderAllFields: false,
    req,
    schemaPath: collection,
  })
  counter.buildFormStateCalls += 1
  counter.totalServerCallTimeMs += performance.now() - t0
}
