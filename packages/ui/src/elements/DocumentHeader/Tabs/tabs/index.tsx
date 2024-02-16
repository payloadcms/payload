import type { DocumentTabConfig } from 'payload/types'
import { RelationshipTab } from './Relationships'
import { ReferencesTab } from './References'
import { VersionsTab } from './Versions'
import { LivePreviewTab } from './LivePreview'
import { APITab } from './API'
import { EditTab } from './Edit'

export const documentViewKeys = [
  'API',
  'Default',
  'LivePreview',
  'References',
  'Relationships',
  'Version',
  'Versions',
]

export type DocumentViewKey = (typeof documentViewKeys)[number]

export const tabs: Record<
  DocumentViewKey,
  DocumentTabConfig & {
    order?: number // TODO: expose this to the globalConfig config
  }
> = {
  API: {
    Tab: APITab,
    order: 1000,
  },
  Default: {
    Tab: EditTab,
    order: 0,
  },
  LivePreview: {
    Tab: LivePreviewTab,
    order: 100,
  },
  References: { Tab: ReferencesTab, order: undefined },
  Relationships: { Tab: RelationshipTab, order: undefined },
  Versions: { Tab: VersionsTab, order: 200 },
}
