import type { BuildFormStateArgs, BuildTableStateArgs, Data, DocumentSlots } from 'payload'

import type { buildFormStateHandler } from '../../utilities/buildFormState.js'
import type { buildTableStateHandler } from '../../utilities/buildTableState.js'

export type GetFormStateClient = (
  args: {
    signal?: AbortSignal
  } & Omit<BuildFormStateArgs, 'clientConfig' | 'req'>,
) => ReturnType<typeof buildFormStateHandler>

export type GetTableStateClientArgs = {
  signal?: AbortSignal
} & Omit<BuildTableStateArgs, 'clientConfig' | 'req'>
export type GetTableStateClient = (
  args: GetTableStateClientArgs,
) => ReturnType<typeof buildTableStateHandler>

export type RenderDocument = (args: {
  collectionSlug: string
  disableActions?: boolean
  docID?: number | string
  drawerSlug?: string
  initialData?: Data
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  signal?: AbortSignal
}) => Promise<{ docID: string; Document: React.ReactNode }>

export type GetDocumentSlots = (args: {
  collectionSlug: string
  signal?: AbortSignal
}) => Promise<DocumentSlots>
