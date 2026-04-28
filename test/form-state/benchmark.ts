import type { Payload, PayloadRequest } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export type EditScript = Array<
  | { index: number; kind: 'removeRow'; path: string }
  | { kind: 'addRow'; path: string }
  | { kind: 'select'; path: string; value: unknown }
  | { kind: 'type'; path: string; perCharDelay: number; value: string }
>

export type CallCounter = {
  buildFormStateCalls: number
  renderFieldsCalls: number
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

  try {
    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())
    const user = data.user

    const req = await createLocalReq({ user }, payload)

    const doc = await payload.create({
      collection: opts.collection,
      data: { title: 'seed' },
    })

    let formState: Record<string, any> = {}
    for (const action of opts.script) {
      if (action.kind === 'type') {
        let acc = ''
        for (const ch of action.value) {
          acc += ch
          formState = { ...formState, [action.path]: { value: acc } }
          await invoke(payload, req, opts.collection, doc.id, formState, counter)
          await new Promise((r) => setTimeout(r, action.perCharDelay))
        }
      } else if (action.kind === 'select') {
        formState = { ...formState, [action.path]: { value: action.value } }
        await invoke(payload, req, opts.collection, doc.id, formState, counter)
      }
      // addRow / removeRow not exercised by Phase 0 baseline; left as future-proof shape.
    }

    await payload.delete({ collection: opts.collection, id: doc.id })
  } finally {
    await payload.destroy()
  }

  return counter
}

async function invoke(
  payload: Payload,
  req: PayloadRequest,
  collection: string,
  id: number | string,
  formState: Record<string, any>,
  counter: CallCounter,
): Promise<void> {
  const t0 = performance.now()
  await buildFormState({
    id,
    collectionSlug: collection,
    data: { id, title: 'seed' },
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
