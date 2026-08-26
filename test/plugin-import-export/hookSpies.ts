import type {
  ExportAfterHook,
  ExportBeforeHook,
  ImportAfterHook,
  ImportBeforeHook,
} from '@payloadcms/plugin-import-export'

import type { postsWithHooksSlug } from './shared.js'

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
  // Mask the `secret` field from exported data
  return args.data.map((row) => {
    const { secret: _secret, ...rest } = row as Record<string, unknown>
    return rest
  })
}

export const exportAfterHook: ExportAfterHook = (args) => {
  hookCalls.exportAfter.push(args)
}

export const importBeforeHook: ImportBeforeHook<typeof postsWithHooksSlug> = (args) => {
  hookCalls.importBefore.push(args)
  // Append '_imported' suffix to each title for verification
  return args.data.map((doc) => ({
    ...doc,
    title: typeof doc.title === 'string' ? `${doc.title}_imported` : doc.title,
  }))
}

export const importAfterHook: ImportAfterHook = (args) => {
  hookCalls.importAfter.push(args)
}
