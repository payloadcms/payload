import type {
  ExportAfterHook,
  ExportBeforeHook,
  ImportAfterHook,
  ImportBeforeHook,
} from '@payloadcms/plugin-import-export'

import type { postsWithHooksSlug } from './shared.js'

import { batchRefFieldName } from './shared.js'

// Recorded invocations — reset between tests via resetHookSpies()
export const hookCalls = {
  exportAfter: [] as Parameters<ExportAfterHook>[0][],
  exportBefore: [] as Parameters<ExportBeforeHook<typeof postsWithHooksSlug>>[0][],
  importAfter: [] as Parameters<ImportAfterHook>[0][],
  importBefore: [] as Parameters<ImportBeforeHook<typeof postsWithHooksSlug>>[0][],
}

export const resetHookSpies = () => {
  hookCalls.exportBefore = []
  hookCalls.exportAfter = []
  hookCalls.importBefore = []
  hookCalls.importAfter = []
}

export const exportBeforeHook: ExportBeforeHook<typeof postsWithHooksSlug> = (args) => {
  hookCalls.exportBefore.push(args)

  const batchRef = args.exportDoc[batchRefFieldName]

  return args.data.map((row) => {
    // Mask the `secret` field from exported data
    const { secret: _secret, ...rest } = row as Record<string, unknown>

    // Stamp the editor's reference onto every row, but only when the form supplied one, so
    // that the tests which do not set it still see unchanged output.
    return batchRef ? { ...rest, [batchRefFieldName]: batchRef } : rest
  })
}

export const exportAfterHook: ExportAfterHook = (args) => {
  hookCalls.exportAfter.push(args)
}

export const importBeforeHook: ImportBeforeHook<typeof postsWithHooksSlug> = (args) => {
  hookCalls.importBefore.push(args)

  const batchRef = args.importDoc[batchRefFieldName]

  // Append '_imported' to each title for verification, and the editor's reference on top of
  // that when the form supplied one, so tests can prove an importDoc value reaches the
  // documents that get created.
  return args.data.map((doc) => {
    if (typeof doc.title !== 'string') {
      return doc
    }

    const suffix = batchRef ? `_imported_${String(batchRef)}` : '_imported'

    return { ...doc, title: `${doc.title}${suffix}` }
  })
}

export const importAfterHook: ImportAfterHook = (args) => {
  hookCalls.importAfter.push(args)
}
