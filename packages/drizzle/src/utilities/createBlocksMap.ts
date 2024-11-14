export type BlocksMap = {
  [path: string]: Record<string, unknown>[]
}

export const createBlocksMap = (data: Record<string, unknown>): BlocksMap => {
  const blocksMap: BlocksMap = {}

  Object.entries(data).forEach(([key, rows]) => {
    if (key.startsWith('_blocks_') && Array.isArray(rows)) {
      const blockType = key.replace('_blocks_', '')

      rows.forEach((row) => {
        if ('_path' in row) {
          if (!(row._path in blocksMap)) {
            blocksMap[row._path] = []
          }

          row.blockType = blockType
          blocksMap[row._path].push(row)

          delete row._path
        }
      })

      delete data[key]
    }
  })

  Object.entries(blocksMap).reduce((sortedBlocksMap, [path, blocks]) => {
    sortedBlocksMap[path] = blocks.sort((a, b) => {
      if (typeof a._order === 'number' && typeof b._order === 'number') {
        return a._order - b._order
      }

      return 0
    })

    return sortedBlocksMap
  }, {})

  return blocksMap
}
