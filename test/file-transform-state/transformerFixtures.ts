import type { UploadTransformer } from 'payload'

/** Test executors record the shared vocabulary; media engines are outside this fixture. */
export function recordingTransformer({
  slug,
  mimeType,
}: {
  mimeType: string
  slug: string
}): UploadTransformer {
  return {
    slug,
    canTransform: ({ doc, operation }) =>
      operation === 'upload' && doc.mimeType === mimeType
        ? { canTransform: true, handledTransformKeys: Object.keys(doc._transforms ?? {}) }
        : false,
    mimeTypes: [mimeType],
    transformFile: async ({ doc, originalDoc, originalSource, source }) => {
      doc.appliedState = structuredClone(doc._transforms)
      doc.entryMimeType = originalDoc.mimeType
      const buffer = await source.arrayBuffer({ maxBytes: 16 * 1024 * 1024 })

      return {
        file: new File([buffer], source.filename, { type: originalSource.mimeType }),
        status: 'continue',
      }
    },
  }
}
