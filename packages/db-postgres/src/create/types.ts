import { Block } from 'payload/types';

export type ArrayRowPromise = (args: { parentID: string | number }) => Promise<Record<string, unknown>[]>

export type ArrayRowPromisesMap = {
  [tableName: string]: ArrayRowPromise
}

export type BlockRowsToInsert = {
  block: Block
  rows: Record<string, unknown>[]
}

export type RowInsertionGroup = {
  row: Record<string, unknown>
  localeRow: Record<string, unknown>
  relationshipRows: Record<string, unknown>[]
  arrayRowPromises: ArrayRowPromisesMap,
  blockRows: { [blockType: string]: BlockRowsToInsert }
}
