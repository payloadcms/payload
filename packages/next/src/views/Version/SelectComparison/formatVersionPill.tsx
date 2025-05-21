import type { TypeWithVersion } from 'payload'

import type { VersionPill } from '../Default/types.js'

import { VersionPillLabel } from './VersionPillLabel.js'

export function formatVersionPill(args: {
  doc: TypeWithVersion<any>
  hasPublishedDoc: boolean
  latestDraftVersionID: string
  latestPublishedVersionID: string
}): VersionPill {
  const { doc, hasPublishedDoc, latestDraftVersionID, latestPublishedVersionID } = args

  if (!doc) {
    return {
      id: '',
      Label: '',
    }
  }

  return {
    id: doc.id,
    Label: (
      <VersionPillLabel
        doc={doc}
        hasPublishedDoc={hasPublishedDoc}
        key={doc.id}
        latestDraftVersionID={latestDraftVersionID}
        latestPublishedVersionID={latestPublishedVersionID}
      />
    ),
  }
}
