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

export type ClipboardCopyData = {
  path: string
  rowIndex?: number
} & (ClipboardCopyBlocksData | ClipboardCopyFieldsData)

export type ClipboardCopyActionArgs = {
  getDataToCopy: () => FormStateWithoutComponents
  t: TFunction
} & ClipboardCopyData

export type ClipboardPasteData = {
  data: FormStateWithoutComponents
  path: string
  rowIndex?: number
} & (ClipboardCopyBlocksData | ClipboardCopyFieldsData)

export type OnPasteFn = (data: ClipboardPasteData) => void

export type ClipboardPasteActionArgs = {
  onPaste: OnPasteFn
  path: string
  t: TFunction
} & (ClipboardCopyBlocksSchema | ClipboardCopyFieldsSchema)

export type ClipboardPasteActionValidateArgs = {
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
) &
  ClipboardPasteData
