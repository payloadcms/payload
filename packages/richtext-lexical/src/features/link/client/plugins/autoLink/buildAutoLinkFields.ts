import type { LinkFields } from '../../../nodes/types.js'
import type { AutoLinkFields } from '../../../server/index.js'

type Args = {
  matchFields?: Partial<LinkFields>
  staticFields?: AutoLinkFields
  url: string
}

export function buildAutoLinkFields({ matchFields, staticFields, url }: Args): LinkFields {
  return {
    newTab: false,
    ...stripReservedAutoLinkFields(staticFields),
    ...stripReservedAutoLinkFields(matchFields),
    linkType: 'custom',
    url,
  } as LinkFields
}

function stripReservedAutoLinkFields(fields?: AutoLinkFields | Partial<LinkFields>) {
  if (!fields) {
    return undefined
  }

  const { doc: _doc, linkType: _linkType, text: _text, url: _url, ...autoLinkFields } = fields

  return autoLinkFields
}
