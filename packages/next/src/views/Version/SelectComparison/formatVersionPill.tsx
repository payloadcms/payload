import type { TypeWithVersion } from 'payload'

import type { VersionPill } from '../Default/types.js'

import { VersionPillLabel } from './VersionPillLabel.js'

export function formatVersionPill(args: {
  doc: TypeWithVersion<any>
  latestDraftVersionID: string
  latestPublishedVersionID: string
}): VersionPill {
  const { doc, latestDraftVersionID, latestPublishedVersionID } = args

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
        key={doc.id}
        latestDraftVersionID={latestDraftVersionID}
        latestPublishedVersionID={latestPublishedVersionID}
      />
    ),
  }
}
