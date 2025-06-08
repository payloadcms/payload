import type { TypeWithVersion } from 'payload'

import type { VersionPill } from '../Default/types.js'

import { VersionPillLabel } from './VersionPillLabel.js'

export function formatVersionPill(args: {
  doc: TypeWithVersion<any>
  hasPublishedDoc: boolean
  /**
   * By default, the date is displayed first, followed by the version label.
   */
  labelFirst?: boolean
  /**
   * @default 'pill'
   */
  labelStyle?: 'pill' | 'text'
  latestDraftVersionID?: string
  latestPublishedVersionID?: string
}): VersionPill {
  const {
    doc,
    hasPublishedDoc,
    labelFirst,
    labelStyle,
    latestDraftVersionID,
    latestPublishedVersionID,
  } = args

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
        labelFirst={labelFirst}
        labelStyle={labelStyle}
        latestDraftVersionID={latestDraftVersionID}
        latestPublishedVersionID={latestPublishedVersionID}
      />
    ),
  }
}
