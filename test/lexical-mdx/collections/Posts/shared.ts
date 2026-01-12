import path from 'path'
import { fileURLToPath } from 'url'

export const docsBasePath =
  typeof window === 'undefined'
    ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../sampleDocs')
    : null
export const languages = {
  ts: 'TypeScript',
  plaintext: 'Plain Text',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
}

export const bannerTypes = {
  success: 'Success',
  info: 'Info',
  warning: 'Warning',
}
