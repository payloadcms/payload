// Stub for server-only Node.js packages when loaded in the browser.
// Payload admin is RSC-based; in TanStack Start's isomorphic environment
// these server-only packages get pulled into the client bundle.
// This stub prevents hard crashes while preserving the module shape.

const noop = () => {}

// ─── file-type ────────────────────────────────────────────────────────────────
export const fileTypeFromFile = undefined
export const fileTypeFromBuffer = undefined
export const fileTypeFromStream = undefined

// ─── pino ─────────────────────────────────────────────────────────────────────
export const pino = noop
export const levels = {}
export const stdSerializers = {}

// ─── mongoose ─────────────────────────────────────────────────────────────────
export const Types = {
  ObjectId: noop,
  Decimal128: noop,
  Buffer: noop,
  Map: noop,
  Mixed: noop,
}
export const Schema = noop
export const model = noop
export const models = {}
export const connect = noop
export const connection = { on: noop, once: noop }
export const set = noop

// ─── sharp ────────────────────────────────────────────────────────────────────
// (sharp is default-export only — handled by the default export below)

// ─── mongodb ──────────────────────────────────────────────────────────────────
export const MongoClient = noop
export const ObjectId = noop

// ─── @aws-sdk/client-s3, etc. ─────────────────────────────────────────────────
export const S3Client = noop
export const GetObjectCommand = noop
export const PutObjectCommand = noop
export const DeleteObjectCommand = noop

// ─── nodemailer ────────────────────────────────────────────────────────────────
export const createTransport = noop

// ─── Node.js util built-in (used for isDeepStrictEqual in getEntityPermissions) ──
export const isDeepStrictEqual = () => false
export const promisify = () => noop
export const inspect = () => ''
export const format = () => ''

// ─── Default catch-all ────────────────────────────────────────────────────────
export default noop
