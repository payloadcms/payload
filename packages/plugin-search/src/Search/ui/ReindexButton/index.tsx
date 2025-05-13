import type { ResolvedCollectionLabels } from '../../../types.js'
import type { SearchReindexButtonServerComponent } from './types.js'

import { ReindexButtonClient } from './index.client.js'

export const ReindexButton: SearchReindexButtonServerComponent = (props) => {
  const { collectionLabels, i18n, searchCollections, searchSlug } = props

  const resolvedCollectionLabels: ResolvedCollectionLabels = Object.fromEntries(
    searchCollections.map((collection) => {
      const labels = collectionLabels[collection]
      const pluralLabel = labels?.plural

      if (typeof pluralLabel === 'function') {
        // @ts-expect-error - I don't know why it gives an error. pluralLabel and i18n.t should both resolve to TFunction<DefaultTranslationKeys>
        return [collection, pluralLabel({ t: i18n.t })]
      }

      if (pluralLabel) {
        return [collection, pluralLabel]
      }

      return [collection, collection]
    }),
  )

  return (
    <ReindexButtonClient
      collectionLabels={resolvedCollectionLabels}
      searchCollections={searchCollections}
      searchSlug={searchSlug}
    />
  )
}
