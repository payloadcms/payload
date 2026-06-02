import type { TFunction } from '@payloadcms/translations'
import type { ClientBlock, ClientField, FormStateWithoutComponents } from 'payload'

export type ClipboardCopyBlocksSchema = {
  schemaBlocks: ClientBlock[]
}

export type ClipboardCopyBlocksData = {
  blocks: ClientBlock[]
  type: 'blocks'
}

export type ClipboardCopyFieldsSchema = {
  schemaFields: ClientField[]
}

export type ClipboardCopyFieldsData = {
  fields: ClientField[]
  type: 'array'
}

export type ClipboardCopyData = (ClipboardCopyBlocksData | ClipboardCopyFieldsData) & {
  path: string
  rowIndex?: number
}

export type ClipboardCopyActionArgs = ClipboardCopyData & {
  getDataToCopy: () => FormStateWithoutComponents
  t: TFunction
}

export type ClipboardPasteData = (ClipboardCopyBlocksData | ClipboardCopyFieldsData) & {
  data: FormStateWithoutComponents
  path: string
  rowIndex?: number
}

export type OnPasteFn = (data: ClipboardPasteData) => void

export type ClipboardPasteActionArgs = (ClipboardCopyBlocksSchema | ClipboardCopyFieldsSchema) & {
  onPaste: OnPasteFn
  path: string
  t: TFunction
}

export type ClipboardPasteActionValidateArgs = ClipboardPasteData & {
  fieldPath: string
} & (
    | {
        schemaBlocks: ClientBlock[]
        type: 'blocks'
      }
    | {
        schemaFields: ClientField[]
        type: 'array'
      }
  )
