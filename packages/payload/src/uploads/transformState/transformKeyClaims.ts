import { transformStateObjectSchema } from './transformStateSchema.js'

const builtInTransformKeys = new Set(Object.keys(transformStateObjectSchema.properties ?? {}))

/**
 * Whether a saved `_transforms` key needs a stage that claims it when the file is processed.
 * Built-in keys change the file, so a value that nothing applies would not match the file. Two
 * kinds of key do not need one; they are saved and do nothing until a stage claims them:
 * - `focalPoint`: it only guides later crops
 * - custom keys: something outside Payload may apply them, for example a CDN
 *
 * A change to such a key rebuilds the file only when a stage that runs claims it. Two claims are
 * always an error.
 */
export const isClaimRequired = (key: string): boolean =>
  key !== 'focalPoint' && builtInTransformKeys.has(key)

/** A focal point change alone keeps the triggers it had before claims (see `planUploadRebuild`). */
export const isFocalPointKey = (key: string): boolean => key === 'focalPoint'
