import type { BlockBlobClient } from '@azure/storage-blob'

import parseRange from 'range-parser'

export const getRangeFromHeader = async (
  blockBlobClient: BlockBlobClient,
  rangeHeader?: string,
): Promise<{ end: number | undefined; start: number }> => {
  const fullRange = { end: undefined, start: 0 }

  if (!rangeHeader) {
    return fullRange
  }

  const size = await blockBlobClient.getProperties().then((props) => props.contentLength)
  if (size === undefined) {
    return fullRange
  }

  const range = parseRange(size, rangeHeader)
  if (range === -1 || range === -2 || range.type !== 'bytes' || range.length !== 1) {
    return fullRange
  }

  return range[0] ?? fullRange
}
