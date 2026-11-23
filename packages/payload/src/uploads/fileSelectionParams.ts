/**
 * The file endpoint's query parameters that pick which file a request reads. They do not change
 * the file.
 */
export const fileSelectionParams = {
  original: 'original',
  prefix: 'prefix',
  version: 'version',
} as const
